import { Plugin, UserConfig } from 'vite'
// @ts-ignore
import externalGlobals from 'rollup-plugin-external-globals'

/**
 * @default 'head-prepend'
 */
export type OptionalInjectTo = 'head' | 'body' | 'head-prepend' | 'body-prepend'
/**
 * HTML标签注入的位置 // Location of HTML tags injection
 * @default 'head-prepend'
 * @description
 * - injectTo优先级从高到低排序：module > config
 * - The injectTo priority is sorted from high to low: module > config
 * - 'head' - 在head标签的末尾注入 // Inject at the end of the head tag
 * - 'body' - 在body标签的末尾注入 // Inject at the end of the head tag
 * - 'head-prepend' - 在head标签的开头注入 // Inject at the start of the head tag
 * - 'body-prepend' - 在body标签的开头注入 // Inject at the start of the body tag
 * - string - 自定义占位符：替换index.html中第一个匹配的自定义占位符 // Custom placeholder: Replace the first matching custom placeholder in index.html
 * @example
 * '<!-- Custom placeholder for vite-plugin-inject-externals -->'
 */
export type InjectTo = OptionalInjectTo | string
/**
 * @property tag HTML标签名 // HTML tag name
 * @property attrs HTML标签属性 // HTML tag attributes
 */
export type HtmlTag = {
  tag: keyof HTMLElementTagNameMap
  attrs?: Record<string, string | boolean | undefined>
}
export type HtmlTagDesc = HtmlTag & { injectTo?: OptionalInjectTo }
/**
 * @property name 模块名 // Module name
 * @property global 全局变量名 // Global variable name
 * @property path CDN链接 // CDN link
 * @property injectTo HTML标签注入的位置 // Location of HTML tags injection
 * @property htmlTag HTML标签的描述信息，path属性会被覆盖 // Descriptor of an HTML tag, and the path attribute will be overwritten
 */
export type InjectExternalsModule = {
  name?: string,
  global?: string,
  path?: string,
  htmlTag?: HtmlTag,
  injectTo?: InjectTo
}
/**
 * 运行哪个命令时插入HTML标签 // Inject HTML tag when running which command
 * @default 'build'
 * @example
 * 'build' - when running build
 * true - 'build' or 'serve'
 */
export type ConfigEnvCommand = 'build' | true
/**
 * @property command 运行哪个命令时插入HTML标签 // Inject HTML tag when running which command
 * @property injectTo HTML标签注入的位置 // Location of HTML tags injection
 * @property modules 模块配置数组 // Module array
 */
export type InjectExternalsConfig = {
  command?: ConfigEnvCommand
  injectTo?: InjectTo,
  modules: InjectExternalsModule[]
}

const injectToRegExp = /^(head|body|head-prepend|body-prepend)$/

/**
 * Single tags set
 */
const singleTags: Set<string> = new Set(['br', 'hr', 'img', 'input', 'param', 'meta', 'link'])
/**
 * 创建HTML标签字符串
 */
const createTag = (htmlTag: HtmlTag) => {
  if (!htmlTag) return ''
  let { tag, attrs } = htmlTag
  if (!tag) return ''
  if (!attrs) attrs = {}
  let htmlTagStr = `<${ tag }`
  for (const attrsKey in attrs) {
    htmlTagStr += ` ${ attrsKey }`
    if (attrs[attrsKey] === false || attrs[attrsKey]) htmlTagStr += `="${ attrs[attrsKey] }"`
  }
  htmlTagStr += `>`
  if (!singleTags.has(tag)) htmlTagStr += `</${ tag }>`
  return htmlTagStr
}
/**
 * 通过模块配置初始化HTML标签的描述
 */
const initHtmlTag = (moduleInfo: InjectExternalsModule & { injectTo: string }): HtmlTagDesc => {
  let htmlTagInjectTo: OptionalInjectTo | undefined = undefined
  if (injectToRegExp.test(moduleInfo.injectTo)) htmlTagInjectTo = moduleInfo.injectTo as OptionalInjectTo
  let htmlTag: HtmlTagDesc
  if (moduleInfo.htmlTag) {
    htmlTag = moduleInfo.htmlTag
    if (htmlTagInjectTo) {
      htmlTag.injectTo = htmlTagInjectTo
    }
    return htmlTag
  }
  if (moduleInfo.name && moduleInfo.global) {
    htmlTag = {
      tag: 'script',
      attrs: {
        type: 'text/javascript',
        src: moduleInfo.path,
        crossorigin: ''
      }
    }
  } else {
    htmlTag = {
      tag: 'link',
      attrs: {
        rel: 'stylesheet',
        href: moduleInfo.path,
        crossorigin: ''
      }
    }
  }
  if (htmlTagInjectTo) htmlTag.injectTo = htmlTagInjectTo
  return htmlTag
}
const injectExternals = (config: InjectExternalsConfig): Plugin => {
  let { command, injectTo, modules } = config
  if (!command) command = 'build'
  if (!injectTo) injectTo = 'head-prepend'
  if (!modules || !Array.isArray(modules)) {
    modules = []
  }
  let canIInject = command === true
  // Map<注入位置, HTML标签字符串数组>
  let strTagsData: Map<string, string[]> = new Map<string, string[]>()
  // 通过vite注入的HTML标签描述符数组
  let htmlTags: HtmlTagDesc[] = []
  // Record<模块名, 全局变量名>
  let globalsOption: Record<string, string> = {}
  // 自定义注入位置的模块数组
  let customModules: (InjectExternalsModule & { injectTo: string })[] = []
  // 通过vite注入的模块数组
  let optionalModules: (InjectExternalsModule & { injectTo: OptionalInjectTo })[] = []
  // 填充globalsOption 模块分类
  for (let moduleItem of modules) {
    // 以裸导入(比如import './test.css')的方式导入资源，如果想要删除导入，global随便给个字符串值，不能是空值
    if (moduleItem.name) globalsOption[moduleItem.name] = moduleItem.global || 'noGlobal&deleteThisImport'
    // path和htmlTag都不存在，说明只需要删除导入和更换全区变量名，跳出循环
    if (!moduleItem.path && !moduleItem.htmlTag) continue
    if (!moduleItem.injectTo) moduleItem.injectTo = injectTo
    if (injectToRegExp.test(moduleItem.injectTo)) {
      optionalModules.push(moduleItem as InjectExternalsModule & { injectTo: OptionalInjectTo })
    } else {
      customModules.push(moduleItem as InjectExternalsModule & { injectTo: string })
    }
  }
  for (const customModule of customModules) {
    let htmlTag = initHtmlTag(customModule)
    let htmlTagArr: string[]
    if (Array.isArray(strTagsData.get(customModule.injectTo))) {
      htmlTagArr = strTagsData.get(customModule.injectTo) as string[]
    } else {
      htmlTagArr = []
      strTagsData.set(customModule.injectTo, htmlTagArr)
    }
    if (htmlTag.tag === 'link') {
      htmlTagArr.unshift(createTag(htmlTag))
    } else {
      htmlTagArr.push(createTag(htmlTag))
    }
    strTagsData.set(customModule.injectTo, htmlTagArr)
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
      for (const [key, strTagSet] of strTagsData) {
        newHtml = newHtml.replace(key, strTagSet.join(joinStr))
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
export default injectExternals
