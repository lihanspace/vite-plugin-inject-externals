<h1 align="center">vite-plugin-inject-externals</h1>

[简体中文](./README.zh-CN.md) | English

When vite is packaged, the specified module is imported from CDN instead.

Script tag and link tag can be inserted into the specified location.

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
      // 默认 'head-prepend'
      injectTo: '<!-- Custom placeholder for vite plugin insert externals -->',
      modules: [
        {
          name: 'vue',
          global: 'Vue',
          path: 'https://unpkg.com/vue@3.2.19/dist/vue.global.prod.js'
          // module没有injectTo, 默认上层的injectTo
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
          injectTo: '<!-- Custom placeholder for vite plugin insert externals -->'
        },
        {
          name: 'axios',
          global: 'axios',
          // 只有name和global, 直接替换全局变量，不注入script标签
          // path: 'https://cdn.jsdelivr.net/npm/axios@0.22.0/dist/axios.min.js'
        },
        // 有path, 没有name和global, 注入link标签
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

## Options

| Name | Desc | Type | Default |
| ---- | ---- | ---- | ------- |
| injectTo |  | |
| | | |

path和htmlTag都存在时，优先使用htmlTag

## License

MIT
