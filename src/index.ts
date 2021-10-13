import { Plugin, HtmlTagDescriptor, UserConfig } from 'vite'
import { GlobalsOption } from 'rollup'
// @ts-ignore
import externalGlobals from 'rollup-plugin-external-globals'

export type DefaultInjectTo = 'head-prepend'
export type OtherInjectTo = 'head' | 'body' | 'body-prepend'
export type OptionalInjectTo = DefaultInjectTo | OtherInjectTo
/**
 * Location of CDN link injection
 * @default 'head-prepend' Inject at the prepend of the head tag
 * @example
 * 'head' - Inject at the end of the head tag
 * 'body' - Inject at the end of the head tag
 * 'head-prepend' - Inject at the prepend of the head tag
 * 'body-prepend' - Inject at the prepend of the body tag
 * string - Custom placeholder - Replace the first matching custom placeholder in index.html
 * e.g.: '<!-- Custom placeholder for vite plugin insert externals -->'
 * @description
 * The injectTo priority is sorted from high to low: htmlTag > module > config
 */
export type InjectTo = OptionalInjectTo | string
export type InsertPathModule = {
  name?: string,
  global?: string,
  path: string,
  htmlTag?: never,
  injectTo?: InjectTo
}
export type InsertHtmlTagModule = {
  name?: string,
  global?: string,
  path?: never,
  htmlTag: HtmlTagDescriptor,
  injectTo?: InjectTo
}
export type OnlyGlobalName = {
  name: string,
  global: string,
  path?: never,
  htmlTag?: never,
  injectTo?: never
}
/**
 * @property name Module name
 * @property global Global variable name
 * @property path CDN link
 * @property injectTo Location of CDN link injection
 * @property htmlTag Inject tags with htmlTag provided by vite, and path will be overwritten
 */
export type InsertExternalsModule = InsertPathModule | InsertHtmlTagModule | OnlyGlobalName
/**
 * Inject HTML tag when running which command
 * @default 'build'
 * @example
 * 'build' - when running build
 * true - 'build' or 'serve'
 */
export type ConfigEnvCommand = 'build' | true
/**
 * @property command At what command does the plugin run
 * @property injectTo Location of CDN link injection
 * @property modules Module collection
 */
export type InsertExternalsConfig = {
  command?: ConfigEnvCommand
  injectTo?: InjectTo,
  modules: InsertExternalsModule[]
}

const injectToRegExp = /^(head|body|head-prepend|body-prepend)$/

const singleTags: string[] = ['br', 'hr', 'img', 'input', 'param', 'meta', 'link']
const createTag = (htmlTag: HtmlTagDescriptor | HtmlTagDescriptor[] | string) => {
  if (Array.isArray(htmlTag)) {
    let scriptStr = ''
    for (const htmlTagItem of htmlTag) {
      scriptStr += createTag(htmlTagItem)
    }
    return scriptStr
  }
  if (typeof htmlTag === 'string') htmlTag = { tag: htmlTag }
  const { tag, attrs, children } = htmlTag
  let scriptStr = `<${ tag }`
  for (const attrsKey in attrs) {
    scriptStr += ` ${ attrsKey }="${ attrs[attrsKey] }"`
  }
  if (children) scriptStr += createTag(children)
  scriptStr += `>`
  if (!singleTags.includes(tag)) scriptStr += `</${ tag }>`
  return scriptStr
}
const initHtmlTag = (moduleInfo: InsertExternalsModule & { injectTo: string }): HtmlTagDescriptor => {
  if (moduleInfo.htmlTag) return moduleInfo.htmlTag
  let htmlTag: HtmlTagDescriptor
  if (moduleInfo.name && moduleInfo.global) {
    htmlTag = {
      tag: 'script',
      attrs: {
        type: 'text/javascript',
        src: moduleInfo.path
      }
    }
  } else {
    htmlTag = {
      tag: 'link',
      attrs: {
        rel: 'stylesheet',
        href: moduleInfo.path
      }
    }
  }
  if (injectToRegExp.test(moduleInfo.injectTo)) {
    htmlTag.injectTo = moduleInfo.injectTo as OptionalInjectTo
  }
  return htmlTag
}
/**
 * see [README.md](https://github.com/lihanspace/vite-plugin-inject-externals/blob/master/README.md)
 */
const insertExternals = (config: InsertExternalsConfig): Plugin => {
  let { command, injectTo, modules } = config
  if (!command) command = 'build'
  if (!injectTo) injectTo = 'head-prepend'
  if (!modules || !Array.isArray(modules)) {
    modules = []
  }
  let canIInject = command === true
  // 字符串标签列表数据
  let strTagsData: Record<string, string[]> = {}
  // 默认注入的标签列表
  let htmlTags: HtmlTagDescriptor[] = []
  // 模块和全局变量名
  let globalsOption: GlobalsOption = {}
  // 自定义注入的模块
  let customModules: (InsertExternalsModule & { injectTo: string })[] = []
  // 默认注入的模块
  let optionalModules: (InsertExternalsModule & { injectTo: OptionalInjectTo })[] = []
  for (let moduleItem of modules) {
    if (moduleItem.name && moduleItem.global) globalsOption[moduleItem.name] = moduleItem.global
    if (!moduleItem.path && !moduleItem.htmlTag) continue
    if (!moduleItem.injectTo) moduleItem.injectTo = injectTo
    if (moduleItem.htmlTag?.injectTo) moduleItem.injectTo = moduleItem.htmlTag.injectTo
    if (injectToRegExp.test(moduleItem.injectTo)) {
      optionalModules.push(moduleItem as InsertExternalsModule & { injectTo: OptionalInjectTo })
    } else {
      customModules.push(moduleItem as InsertExternalsModule & { injectTo: string })
    }
  }
  for (const customModule of customModules) {
    let htmlTag = initHtmlTag(customModule)
    if (!Array.isArray(strTagsData[customModule.injectTo])) {
      strTagsData[customModule.injectTo] = []
    }
    if (htmlTag.tag === 'link') {
      strTagsData[customModule.injectTo].unshift(createTag(htmlTag))
    } else {
      strTagsData[customModule.injectTo].push(createTag(htmlTag))
    }
  }
  for (const optionalModule of optionalModules) {
    let htmlTag = initHtmlTag(optionalModule)
    if (htmlTag.tag === 'link') {
      htmlTags.unshift(htmlTag)
    } else {
      htmlTags.push(htmlTag)
    }
  }
  return {
    name: 'vite-plugin-inject-externals',
    config(uc, { command: viteCommand }) {
      const userConfig: UserConfig = {
        build: {
          rollupOptions: {}
        }
      }
      if (viteCommand === 'build') {
        canIInject = true
        userConfig.build!.rollupOptions = {
          // external: [...externalLibs],
          plugins: [externalGlobals(globalsOption)]
        }
      }
      return userConfig
    },
    transformIndexHtml(html) {
      let newHtml = html
      const pattern = /<head>\r?\n+\s*</
      const execArr = pattern.exec(newHtml)
      let spaceStr = ''
      if (execArr) {
        let [val] = execArr
        val = val.substring(6, val.length - 1)
        spaceStr = val.replace(/\r/g, '').replace(/\n/g, '')
      }
      let joinStr = spaceStr ? `\n${ spaceStr }` : '\n  '
      for (const key in strTagsData) {
        newHtml = newHtml.replace(key, strTagsData[key].join(joinStr))
      }
      if (canIInject) {
        return {
          html: newHtml,
          tags: htmlTags
        }
      } else {
        return html
      }
    }
  }
}
export default insertExternals
