<h1 align="center">vite-plugin-inject-externals</h1>

[简体中文](./README.zh-CN.md) | English

When vite is packaged, the specified module is imported from CDN instead.

Script tag and link tag can be injected into the specified location.

Reduce build time and increase page load speed in production environments.

<p align="center">
    <a href="https://npmjs.com/package/vite-plugin-inject-externals/releases"><img src="https://img.shields.io/npm/v/vite-plugin-inject-externals.svg" alt="npm package"></a>
    <a href="https://github.com/lihanspace/vite-plugin-inject-externals/releases"><img src="https://img.shields.io/github/v/release/lihanspace/vite-plugin-inject-externals.svg" alt="github release"></a>
    <a href="https://github.com/lihanspace/vite-plugin-inject-externals/blob/master/LICENSE"><img src="https://img.shields.io/github/license/lihanspace/vite-plugin-inject-externals.svg" alt="License"></a>
</p>

## Installation

Install the plugin with npm:

```shell
npm install --save-dev vite-plugin-inject-exterbals
```

or yarn

```shell
yarn add --dev vite-plugin-inject-exterbals
```

## Basic Usage

```js
// vite.config.js or vite.config.ts
import injectExterbals from 'vite-plugin-inject-externals'

export default {
  plugins: [
    injectExterbals({
      // Default value: 'head-prepend'
      // The custom injection location will replace the corresponding text in index.html
      injectTo: '<!-- Custom placeholder for vite plugin inject externals -->',
      modules: [
        {
          name: 'vue',
          global: 'Vue',
          path: 'https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js'
          // Module has no injectto. The injectto of the previous layer is the default
        },
        {
          name: 'vue-router',
          global: 'VueRouter',
          htmlTag: {
            tag: 'script',
            attrs: {
              type: 'text/javascript',
              src: 'https://unpkg.com/vue-router@4.0.11/dist/vue-router.global.prod.js'
              // HtmlTag has no injectto. The injectto of the previous layer is the default
            }
          },
          injectTo: '<!-- Custom placeholder for vite plugin inject externals -->'
        },
        {
          name: 'axios',
          global: 'axios',
          // If there are name and global, but there are no path and htmltag, the global variables will be replaced directly, but the script tag will not be injected
          // path: 'https://cdn.jsdelivr.net/npm/axios@0.22.0/dist/axios.min.js'
        },
        // If there is path but no name and global, the link tag will be injected
        // {
        //   path: 'https://cdn.jsdelivr.net/npm/md-editor-v3@1.5.0/lib/style.css',
        // },
        {
          // Inject custom htmltag
          htmlTag: {
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: 'https://cdn.jsdelivr.net/npm/md-editor-v3@1.5.0/lib/style.css'
            }
          },
          injectTo: '<!-- example1 -->'
        },
        {
          name: 'md-editor-v3',
          global: 'MdEditorV3',
          path: 'https://cdn.jsdelivr.net/npm/md-editor-v3@1.5.0/lib/md-editor-v3.umd.js',
          injectTo: '<!-- example2 -->'
        },
        {
          name: 'dayjs',
          global: 'dayjs',
          path: 'https://cdn.jsdelivr.net/npm/dayjs@1.8.21/dayjs.min.js',
          injectTo: '<!-- example3 -->'
        }
      ]
    })
  ],
}
```

## Result
```js
// dev
import { createApp } from 'vue'
createApp()

// build
Vue.createApp()
```
```html
<!-- Inject CDN links -->
<script type="text/javascript" src="https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js"></script>
```

## InjectExternalsConfig

Name | Required | Desc | Type | Default
:---: | :---: | :---: | :---: | :---:
command | `false` | Inject HTML tag when running which command, A value of true indicates that HTML tags are injected when both build and serve commands are run | `'build' / true` | `'build'`
injectTo | `false` | Location of HTML tags injection | `'head' / 'body' / 'head-prepend' / 'body-prepend' / string` | `'head-prepend'`
modules | `true` | Modules configuration | `InjectExternalsModule[]` | `[]`

### InjectExternalsModule

Name | Required | Desc | Type | Default
:---: | :---: | :---: | :---: | :---:
name | `false` | Module name | `string`
global | `false` | Global variables corresponding to the module | `string`
path | `true` | CDN link of JS or CSS resources. If there is no name or global, it indicates that it is a CSS resource. | `string`
htmlTag | `true` | Custom HTML tags, priority is higher than path. | `HtmlTagDescriptor`
injectTo | `false` | Location of HTML tags injection | `string` | `InjectExternalsConfig.injectTo`

#### HtmlTagDescriptor
```ts
import { HtmlTagDescriptor } from 'vite'
```
Name | Required | Desc | Type | Default
:---: | :---: | :---: | :---: | :---:
tag | `true` | Tag name | `string`
attrs | `false` | Attributes(`{ 'Attribute name': 'Attribute value' }`) | `object`
children | `false` | Child element (child element tag name or HtmlTagDescriptor collection of child elements) | `string / HtmlTagDescriptor[]`
injectTo | `false` | Location of HTML tags injection | `'head' / 'body' / 'head-prepend' / 'body-prepend'` | `InjectExternalsModule.injectTo`

## License

MIT
