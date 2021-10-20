<h1 align="center">vite-plugin-inject-externals</h1>

简体中文 | [English](./README.md)

在vite打包时将指定的包改为从CDN引入。

script标签和link标签可以注入到指定位置。

减少构建时间,并提高生产环境中页面加载速度。

<p align="center">
    <a href="https://npmjs.com/package/vite-plugin-inject-externals"><img src="https://img.shields.io/npm/v/vite-plugin-inject-externals.svg?style=plastic&color=cb0303" alt="npm package"></a>
    <a href="https://npmjs.com/package/vite-plugin-inject-externals"><img src="https://img.shields.io/npm/dm/vite-plugin-inject-externals.svg?style=plastic" alt="downloads/month"></a>
    <a href="https://github.com/lihanspace/vite-plugin-inject-externals/releases"><img src="https://img.shields.io/github/v/release/lihanspace/vite-plugin-inject-externals.svg?style=plastic" alt="github release"></a>
    <a href="https://github.com/lihanspace/vite-plugin-inject-externals/blob/master/LICENSE"><img src="https://img.shields.io/github/license/lihanspace/vite-plugin-inject-externals.svg?style=plastic" alt="License"></a>
</p>

## 安装
通过npm下载
```shell
npm install --save-dev vite-plugin-inject-exterbals
```
通过yarn下载
```shell
yarn add --dev vite-plugin-inject-exterbals
```

## 基本用法

```js
// vite.config.js
import injectExterbals from 'vite-plugin-inject-externals'

export default {
  plugins: [
    injectExterbals({
      // 默认 'head-prepend'
      // 自定义注入位置将会替换index.html中的对应文本
      injectTo: '<!-- Custom placeholder for vite plugin inject externals -->',
      modules: [
        {
          name: 'vue',
          global: 'Vue',
          path: 'https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js'
          // 如果module没有injectTo, 默认上层的injectTo
        },
        {
          name: 'vue-router',
          global: 'VueRouter',
          htmlTag: {
            tag: 'script',
            attrs: {
              type: 'text/javascript',
              src: 'https://unpkg.com/vue-router@4.0.11/dist/vue-router.global.prod.js'
            }
          },
          injectTo: '<!-- Custom placeholder for vite plugin inject externals -->'
        },
        {
          name: 'axios',
          global: 'axios',
          // 如果有name和global，但是没有path和htmltag，会直接替换全局变量，但是不注入script标签
          // path: 'https://cdn.jsdelivr.net/npm/axios@0.22.0/dist/axios.min.js'
        },
        // 如果有path, 但是没有name和global, 会注入link标签
        // {
        //   path: 'https://cdn.jsdelivr.net/npm/md-editor-v3@1.5.0/lib/style.css',
        // },
        {
          // 注入自定义htmlTag
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

## 效果

```js
// dev
import { createApp } from 'vue'
createApp()

// build
Vue.createApp()
```

```html
<!-- 注入CDN链接 -->
<script type="text/javascript" src="https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js"></script>
```

## InjectExternalsConfig

Name | Required | Desc | Type | Default
:---: | :---: | :---: | :---: | :---:
command | `false` | 在运行哪个命令时注入html标签，build表示在打包时注入，true表示build和serve命令都注入 | `'build' / true` | `'build'` 
injectTo | `false` | 生成的html标签注入到什么位置 | `'head' / 'body' / 'head-prepend' / 'body-prepend' / string` | `'head-prepend'`
modules | `true` | 模块配置 | `InjectExternalsModule[]` | `[]`

### InjectExternalsModule

Name | Required | Desc | Type | Default
:---: | :---: | :---: | :---: | :---:
name | `false` | 模块名 | `string`
global | `false` | 全局变量 | `string`
path | `false` | js或者css资源的cdn链接，如果没有name或global，表示是css资源 | `string`
htmlTag | `false` | 自定义html标签，优先级比path高 | `HtmlTag`
injectTo | `false` | 生成的html标签注入到什么位置 | `string` | `InjectExternalsConfig.injectTo`

#### HtmlTag

Name | Required | Desc | Type | Default
:---: | :---: | :---: | :---: | :---:
tag | `true` | 标签名 | `string`
attrs | `false` | 属性(`{ 属性名: 属性值 }`) | `object`

## 开源许可证

MIT
