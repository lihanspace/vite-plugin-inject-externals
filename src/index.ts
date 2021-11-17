import { Plugin, UserConfig } from 'vite'
// @ts-ignore
import externalGlobals from 'rollup-plugin-external-globals'

export type DefaultInjectTo = 'head-prepend'
export type OtherInjectTo = 'head' | 'body' | 'body-prepend'
export type OptionalInjectTo = DefaultInjectTo | OtherInjectTo
/**
 * Location of HTML tags injection
 * @default 'head-prepend' Inject at the prepend of the head tag
 * @example
 * 'head' - Inject at the end of the head tag
 * 'body' - Inject at the end of the head tag
 * 'head-prepend' - Inject at the prepend of the head tag
 * 'body-prepend' - Inject at the prepend of the body tag
 * string - Custom placeholder - Replace the first matching custom placeholder in index.html
 * e.g.: '<!-- Custom placeholder for vite plugin inject externals -->'
 * @description
 * The injectTo priority is sorted from high to low: htmlTag > module > config
 */
export type InjectTo = OptionalInjectTo | string
/**
 * Html tag name
 */
export type HtmlTagName = keyof HTMLElementTagNameMap
/**
 * @property tag Html tag name
 * @property attrs Html tag attributes
 */
export type HtmlTag = {
  tag: HtmlTagName
  attrs?: Record<string, string | boolean | undefined>
}
export type HtmlTagDesc = HtmlTag & { injectTo?: OptionalInjectTo }
/**
 * @property name Module name
 * @property global Global variable name
 * @property path CDN link
 * @property injectTo Location of HTML tags injection
 * @property htmlTag Descriptor of an HTML tag, and path will be overwritten
 */
export type InjectExternalsModule = {
  name?: string,
  global?: string,
  path?: string,
  htmlTag?: HtmlTag,
  injectTo?: InjectTo
}
/**
 * Inject HTML tag when running which command
 * @default 'build'
 * @example
 * 'build' - when running build
 * true - 'build' or 'serve'
 */
export type ConfigEnvCommand = 'build' | true
/**
 * @property command Inject HTML tag when running which command
 * @property injectTo Location of HTML tags injection
 * @property modules Module collection
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
 * Create an HTML tag of string type
 * @param htmlTag The descriptor or name of an HTML tag
 */
const createTag = (htmlTag: HtmlTag | HtmlTagName) => {
  if (!htmlTag) return ''
  if (typeof htmlTag === 'string') htmlTag = { tag: htmlTag, attrs: {} }
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
 * Initialize the descriptor of an HTML tag
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
        crossorigin: 'anonymous'
      }
    }
  } else {
    htmlTag = {
      tag: 'link',
      attrs: {
        rel: 'stylesheet',
        href: moduleInfo.path,
        crossorigin: 'anonymous'
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
  // Map<Injection location of type string, Array of HTML tags of string type>
  let strTagsData: Map<string, string[]> = new Map<string, string[]>()
  // Array of descriptors of HTML tags injected by vite
  let htmlTags: HtmlTagDesc[] = []
  // Record<Module name, Global variable name>
  let globalsOption: Record<string, string> = {}
  // Array of modules of custom injection location
  let customModules: (InjectExternalsModule & { injectTo: string })[] = []
  // Array of modules injected by vite
  let optionalModules: (InjectExternalsModule & { injectTo: OptionalInjectTo })[] = []
  // Fill globalsOption and classify modules
  for (let moduleItem of modules) {
    if (moduleItem.name && moduleItem.global) globalsOption[moduleItem.name] = moduleItem.global
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
