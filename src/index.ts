import { Plugin, HtmlTagDescriptor, UserConfig } from 'vite'
import { GlobalsOption } from 'rollup'
// @ts-ignore
import externalGlobals from 'rollup-plugin-external-globals'
export type DefaultInjectTo = 'head-prepend'
export type OtherInjectTo = 'head' | 'body' | 'body-prepend'
export type OptionalInjectTo = DefaultInjectTo | OtherInjectTo
/**
 * @name InjectTo
 * @type InjectTo
 * 插入的位置
 * @default 'head-prepend' 插入到head标签开头
 * @example
 * 'head' - 插入到head标签末尾
 * 'body' - 插入到body标签末尾
 * 'head-prepend' - 插入到head标签开头
 * 'body-prepend' - 插入到body标签开头
 * string 自定义占位符 - 替换index.html中第一次匹配到的自定义占位符
 * 例如: '<!-- vite-plugin-insert-externals占位 -->'
 * @description
 * InsertExternalsModule.injectTo的优先级比InsertExternalsConfig.injectTo的优先级高
 */
export type InjectTo = OptionalInjectTo | string
/**
 * @namespace InsertExternalsModule
 * @property name 模块名
 * @property global 全局变量名
 * @property path cdn链接
 * @property injectTo 插入的位置
 * @property htmlTag 使用vite自带的htmlTag插入标签，path和injectTo将被覆盖
 */
export type InsertExternalsModule = {
  name?: string,
  global?: string,
  path?: string,
  injectTo?: InjectTo,
  htmlTag?: HtmlTagDescriptor
}
/**
 * 参数配置
 */
export type InsertExternalsConfig = {
  injectTo?: InjectTo
  modules: InsertExternalsModule[]
}
const ErrorTitle = Symbol('ErrorTitle')
/**
 * vite-plugin-inject-external的错误信息
 * @property {?string} message 错误信息
 * @property {?InsertExternalsModule} module 错误module
 */
export class VitePluginInjectExternalsError extends Error {
  [key: string | symbol]: any
  [ErrorTitle] = 'vite-plugin-inject-externals Error'
  constructor(err: { message?: string, [key: string]: any }) {
    super()
    for (const errKey in err) {
      this[errKey] = err[errKey]
    }
  }
}
const createTag = (tagName: string, attrs: Record<string, string | boolean | undefined>) => {
  let scriptStr = `<${ tagName }`
  for (const attrsKey in attrs) {
    scriptStr += ` ${ attrsKey }="${ attrs[attrsKey] }"`
  }
  scriptStr += `></${ tagName }>`
  return scriptStr
}
/**
 * [README.md](https://github.com/lihanspace/master/README.md)
 * @see [README.md](../README.md)
 */
const insertExternals = (config: InsertExternalsConfig): Plugin => {
  let { injectTo, modules } = config
  if (!modules || !Array.isArray(modules)) {
    modules = []
  }
  let isBuild = false
  if (!injectTo) injectTo = 'head-prepend'
  const injectToRegExp = /^(head|body|head-prepend|body-prepend)$/
  // 处理module
  let strTagsData: Record<string, string[]> = {}
  let htmlTags: HtmlTagDescriptor[] = []
  // 模块和全局变量名
  let globalsOption: GlobalsOption = {}
  let customModules: (InsertExternalsModule & { injectTo: string })[] = []
  let optionalModules: (InsertExternalsModule & { injectTo: OptionalInjectTo })[] = []
  for (const item of modules) {
    let moduleItem = { ...item, injectTo: item.injectTo || injectTo }
    if (moduleItem.htmlTag || injectToRegExp.test(moduleItem.injectTo)) {
      moduleItem = { ...moduleItem, injectTo: moduleItem.injectTo as OptionalInjectTo }
      optionalModules.push(moduleItem as InsertExternalsModule & { injectTo: OptionalInjectTo })
    } else {
      customModules.push(moduleItem)
    }
  }
  for (const customModule of customModules) {
    if (!customModule.path) {
      console.error(new VitePluginInjectExternalsError({ message: 'htmlTag和path至少存在一个', module: customModule }))
      continue
    }
    if (!Array.isArray(strTagsData[customModule.injectTo])) {
      strTagsData[customModule.injectTo] = []
    }
    if (!customModule.name || !customModule.global) {
      // css
      strTagsData[customModule.injectTo].unshift(createTag('link', {
        rel: 'stylesheet',
        href: customModule.path
      }))
    } else {
      // js
      globalsOption[customModule.name] = customModule.global
      strTagsData[customModule.injectTo].push(createTag('script', {
        type: 'text/javascript',
        src: customModule.path
      }))
    }
  }
  for (const optionalModule of optionalModules) {
    if (optionalModule.htmlTag) {
      if (optionalModule.htmlTag.tag === 'link') {
        htmlTags.unshift(optionalModule.htmlTag)
      } else {
        htmlTags.push(optionalModule.htmlTag)
      }
      continue
    }
    if (!optionalModule.path) {
      console.error(new VitePluginInjectExternalsError({ message: 'htmlTag和path至少存在一个', module: optionalModule }))
      continue
    }
    if (!optionalModule.name || !optionalModule.global) {
      // css
      htmlTags.unshift({
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: optionalModule.path
        },
        injectTo: optionalModule.injectTo as "head" | "body" | "head-prepend" | "body-prepend"
      })
    } else {
      // js
      globalsOption[optionalModule.name] = optionalModule.global
      htmlTags.push({
        tag: 'script',
        attrs: {
          type: 'text/javascript',
          src: optionalModule.path
        },
        injectTo: optionalModule.injectTo as "head" | "body" | "head-prepend" | "body-prepend"
      })
    }
  }
  return {
    name: 'vite-plugin-inject-externals',
    config(uc, { command }) {
      const userConfig: UserConfig = {
        build: {
          rollupOptions: {}
        }
      }

      if (command === 'build') {
        isBuild = true

        userConfig.build!.rollupOptions = {
          // external: [...externalLibs],
          plugins: [externalGlobals(globalsOption)]
        }


      } else {
        isBuild = false
      }

      return userConfig
    },
    transformIndexHtml(html) {
      const pattern = /<head>\r?\n+\s*</
      const execArr = pattern.exec(html)
      let spaceStr = ''
      if (execArr) {
        let [val] = execArr
        val = val.substring(6, val.length - 1)
        spaceStr = val.replace(/\r/g, '').replace(/\n/g, '')
      }
      let joinStr = spaceStr ? `\n${ spaceStr }` : '\n  '
      for (const key in strTagsData) {
        html = html.replace(key, strTagsData[key].join(joinStr))
      }
      return {
        html,
        tags: htmlTags
      }
    }
  }
}
export default insertExternals
