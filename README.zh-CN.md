<h1 align="center">vite-plugin-inject-externals</h1>

简体中文 | [English](./README.md)

在vite打包时将指定的包改为从CDN引入。

script标签和link标签可以注入到指定位置。

减少构建时间,并提高生产环境中页面加载速度。

<p align="center">
    <a href="https://npmjs.com/package/vite-plugin-inject-externals"><img src="https://img.shields.io/npm/v/vite-plugin-inject-externals.svg?style=plastic&color=cb0303" alt="npm package"></a>
    <a href="https://npmjs.com/package/vite-plugin-inject-externals"><img src="https://img.shields.io/npm/dm/vite-plugin-inject-externals.svg?style=plastic&color=eb7738" alt="npm downloads/month"></a>
    <a href="https://npmjs.com/package/vite-plugin-inject-externals"><img src="https://img.shields.io/bundlephobia/min/vite-plugin-inject-externals.svg?style=plastic&color=12bd79" alt="npm minified size"></a>
    <a href="https://github.com/lihanspace/vite-plugin-inject-externals/releases"><img src="https://img.shields.io/github/v/release/lihanspace/vite-plugin-inject-externals.svg?display_name=release&sort=semver&style=plastic" alt="github release"></a>
    <a href="https://github.com/lihanspace/vite-plugin-inject-externals/blob/master/LICENSE"><img src="https://img.shields.io/github/license/lihanspace/vite-plugin-inject-externals.svg?style=plastic" alt="License"></a>
</p>

## 安装

通过npm下载

```shell
npm install --save-dev vite-plugin-inject-externals
```

## 基本用法

```js
// vite.config.js
import injectExternals from 'vite-plugin-inject-externals'

export default {
  plugins: [
    injectExternals({
      // 默认 'head-prepend'
      // 自定义注入位置将会替换index.html中的对应文本
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
          // 如果有name和global，但是没有path和htmltag，会直接替换全局变量，但是不注入script标签
          // path: 'https://cdn.jsdelivr.net/npm/axios@0.22.0/dist/axios.min.js'
        },
        {
          name: 'md-editor-v3',
          global: 'MdEditorV3',
          path: 'https://cdn.jsdelivr.net/npm/md-editor-v3@1.5.0/lib/md-editor-v3.umd.js',
          injectTo: '<!-- example2 -->'
        },
        // 如果有path, 但是没有global, 会注入link标签
        {
          name: 'md-editor-v3/lib/style.css',
          // 如果有name，但是没有global，会删除掉name的导入，仅适用于裸导入(import 'md-editor-v3/lib/style.css')
          path: 'https://cdn.jsdelivr.net/npm/md-editor-v3@1.5.0/lib/style.css',
        }
      ]
    })
  ],
}
```

## 效果

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
<!-- 注入CDN链接 -->
<script type="text/javascript" src="https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js"></script>
```

## 延伸用法

```js
// vite.config.js
import injectExternals from 'vite-plugin-inject-externals'

export default {
  plugins: [
    injectExternals({
      // 默认 'head-prepend'
      // 自定义注入位置将会替换index.html中的对应文本
      injectTo: '<!-- Custom placeholder for vite plugin inject externals -->',
      modules: [
        {
          name: 'vue',
          // 当导入方式是裸导入时(import 'md-editor-v3/lib/style.css')，并且有name('md-editor-v3/lib/style.css')但是没有global，会删除导入
          // 当导入方式不是裸导入时，并且有name和global，会替换全局变量
          global: 'Vue',
          // 有path时，如果name和global, 会注入script标签
          // 有path时, 如果没有global, 会注入link标签
          path: 'https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js',
          // 自定义html标签，优先级比path高
          htmlTag: {
            tag: 'script',
            attrs: {
              type: 'text/javascript',
              crossorigin: '',
              src: 'https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js'
            }
          },
          // 如果module没有injectTo, 默认上层的injectTo
          injectTo: '<!-- Custom1 -->'
        }
      ]
    })
  ],
}
```

## InjectExternalsConfig

|   Name   | Required |                            Desc                             |                             Type                             |     Default      |
|:--------:|:--------:|:-----------------------------------------------------------:|:------------------------------------------------------------:|:----------------:|
| command  | `false`  | 在运行哪个命令时注入html标签，build表示在打包时注入，true表示build和serve命令都注入 |                       `'build' / true`                       |    `'build'`     |
| injectTo | `false`  |                      生成的html标签注入到什么位置                       | `'head' / 'body' / 'head-prepend' / 'body-prepend' / string` | `'head-prepend'` |
| modules  |  `true`  |                            模块配置                             |                  `InjectExternalsModule[]`                   |       `[]`       |

### InjectExternalsModule

|   Name   | Required |                  Desc               |   Type    |             Default              |
|:--------:|:--------:|:-----------------------------------:|:---------:|:--------------------------------:|
|   name   | `false`  |                 模块名                 | `string`  |
|  global  | `false`  |                全局变量                 | `string`  |
|   path   | `false`  | js或者css资源的cdn链接，如果没有global，表示是css资源 | `string`  |
| htmlTag  | `false`  |         自定义html标签，优先级比path高         | `HtmlTag` |
| injectTo | `false`  |          生成的html标签注入到什么位置           | `string`  | `InjectExternalsConfig.injectTo` |

#### HtmlTag

| Name  | Required |        Desc        |   Type   | Default |
|:-----:|:--------:|:------------------:|:--------:|:-------:|
|  tag  |  `true`  |        标签名         | `string` |
| attrs | `false`  | 属性(`{ 属性名: 属性值 }`) | `object` |

## 开源许可证

MIT
