<h1 align="center">vite-plugin-inject-externals</h1>

[简体中文](./README.zh-CN.md) | English

When vite is packaged, the specified module is imported from CDN instead.

Script tag and link tag can be injected into the specified location.

Reduce build time and increase page load speed in production environments.

<p align="center">
    <a href="https://npmjs.com/package/vite-plugin-inject-externals"><img src="https://img.shields.io/npm/v/vite-plugin-inject-externals.svg?style=plastic&color=cb0303" alt="npm package"></a>
    <a href="https://npmjs.com/package/vite-plugin-inject-externals"><img src="https://img.shields.io/npm/dm/vite-plugin-inject-externals.svg?style=plastic&color=eb7738" alt="npm downloads/month"></a>
    <a href="https://npmjs.com/package/vite-plugin-inject-externals"><img src="https://img.shields.io/bundlephobia/min/vite-plugin-inject-externals.svg?style=plastic&color=12bd79" alt="npm minified size"></a>
    <a href="https://github.com/lihanspace/vite-plugin-inject-externals/releases"><img src="https://img.shields.io/github/v/release/lihanspace/vite-plugin-inject-externals.svg?display_name=release&sort=semver&style=plastic" alt="github release"></a>
    <a href="https://github.com/lihanspace/vite-plugin-inject-externals/blob/master/LICENSE"><img src="https://img.shields.io/github/license/lihanspace/vite-plugin-inject-externals.svg?style=plastic" alt="License"></a>
</p>

## Installation

Install the plugin with npm:

```shell
npm install --save-dev vite-plugin-inject-externals
```

## Basic Usage

```js
// vite.config.js
import injectExternals from 'vite-plugin-inject-externals'

export default {
  plugins: [
    injectExternals({
      // Default value: 'head-prepend'
      // The custom injection location will replace the corresponding text in index.html
      injectTo: '<!-- Custom placeholder for vite plugin inject externals -->',
      modules: [
        {
          name: 'vue',
          global: 'Vue',
          path: 'https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js'
        },
        {
          name: 'axios',
          global: 'axios',
          // If there are name and global, but there are no path and htmltag, the global variables will be replaced directly, but the script tag will not be injected
          // path: 'https://cdn.jsdelivr.net/npm/axios@0.22.0/dist/axios.min.js'
        },
        {
          name: 'md-editor-v3',
          global: 'MdEditorV3',
          path: 'https://cdn.jsdelivr.net/npm/md-editor-v3@1.5.0/lib/md-editor-v3.umd.js',
          injectTo: '<!-- example2 -->'
        },
        // If there is path but no global, the link tag will be injected
        {
          name: 'md-editor-v3/lib/style.css',
          // If there is a name but no global, the import of name will be deleted, which is only applicable to bare imports(import 'md-editor-v3/lib/style.css')
          path: 'https://cdn.jsdelivr.net/npm/md-editor-v3@1.5.0/lib/style.css',
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
import axios from 'axios'
import MdEditorV3 from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

createApp()
axios()
console.log(MdEditorV3)

// build
Vue.createApp()
axios()
console.log(MdEditorV3)
```

```html
<!-- Inject CDN links -->
<script type="text/javascript" src="https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js"></script>
```

## Extended usage

```js
// vite.config.js
import injectExternals from 'vite-plugin-inject-externals'

export default {
  plugins: [
    injectExternals({
      // Default value: 'head-prepend'
      // The custom injection location will replace the corresponding text in index.html
      injectTo: '<!-- Custom placeholder for vite plugin inject externals -->',
      modules: [
        {
          name: 'vue',
          // When the import method is bare imports(import 'md-editor-v3/lib/style.css'), and there is a name('md-editor-v3/lib/style.css') but no global, the import will be deleted.
          // When the import method is not bare imports, and there are name and global, the global variables will be replaced.
          global: 'Vue',
          // If there is a path, the script tag will be injected if there are name and global.
          // If there is a path, the link tag will be injected if there is no global.
          path: 'https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js',
          // Custom HTML tags with higher priority than path
          htmlTag: {
            tag: 'script',
            attrs: {
              type: 'text/javascript',
              crossorigin: '',
              src: 'https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js'
            }
          },
          // Module has no injectto. The injectto of the previous layer is the default
          injectTo: '<!-- Custom1 -->'
        }
      ]
    })
  ],
}
```

## InjectExternalsConfig

|   Name   |  Required |                                                                     Desc                                                                     |                             Type                             |     Default      |
|:--------:|:---------:|:--------------------------------------------------------------------------------------------------------------------------------------------:|:------------------------------------------------------------:|:----------------:|
| command  |  `false`  | Inject HTML tag when running which command, A value of true indicates that HTML tags are injected when both build and serve commands are run |                       `'build' / true`                       |    `'build'`     |
| injectTo |  `false`  |                                                       Location of HTML tags injection                                                        | `'head' / 'body' / 'head-prepend' / 'body-prepend' / string` | `'head-prepend'` |
| modules  |  `true`   |                                                            Modules configuration                                                             |                  `InjectExternalsModule[]`                   |       `[]`       |

### InjectExternalsModule

|   Name   | Required |                                              Desc                                               |   Type    |                    Default       |
|:--------:|:--------:|:-----------------------------------------------------------------------------------------------:|:---------:|:--------------------------------:|
|   name   | `false`  |                                           Module name                                           | `string`  |
|  global  | `false`  |                          Global variables corresponding to the module                           | `string`  |
|   path   |  `true`  | CDN link of JS or CSS resources. If there is no global, it indicates that it is a CSS resource. | `string`  |
| htmlTag  |  `true`  |                         Custom HTML tags, priority is higher than path.                         | `HtmlTag` |
| injectTo | `false`  |                                 Location of HTML tags injection                                 | `string`  | `InjectExternalsConfig.injectTo` | 

#### HtmlTag

| Name  | Required |                         Desc                          |   Type   | Default |
|:-----:|:--------:|:-----------------------------------------------------:|:--------:|:-------:|
|  tag  |  `true`  |                       Tag name                        | `string` |
| attrs | `false`  | Attributes(`{ 'Attribute name': 'Attribute value' }`) | `object` |

## License

MIT
