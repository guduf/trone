import { readFile } from 'fs-extra'
import Vue from 'vue'
import { createRenderer } from 'vue-server-renderer'
import { join as joinPath } from 'path'
import glob from 'glob'
import deepmerge from 'deepmerge'
import { promisify as p } from 'util'

class DomEngine {
  constructor(ctx) {
    this._ctx = ctx
    const layoutConf =  ctx.conf.layout || {}
    this._defaultPage = {
      template: `
      <layout v-bind:layout="layout">
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="text">{{ text }}</p>
      </layout>
      `,
      data: {
        layout: layoutConf,
        title: layoutConf.defaultTitle || '',
        text: layoutConf.defaultText || ''
      }
    }
  }

  _defaultComponents = []
  _globs = {}
  _pages = {}

  async init() {
    await this._loadDefaultComponents(joinPath(__dirname, './layout/index.template.html'))
    const {lib} = this._ctx.command.paths
    if (lib) for (const path of glob.sync(joinPath(lib, '/**/*.comp.js'))) {
      const match = path.match(/\/([a-z][a-z0-9-]*)\.comp\.js$/)
      if (match) {
        this._globs[match[1]] = path
      }
    }
    this._renderer = createRenderer({
      template: await readFile(joinPath(__dirname, './layout/index.template.html'), 'utf-8')
    })
    let pageStyle
    try {
      const sass = await import('sass')
      const result = await p(sass.render)({
        file: joinPath(__dirname, './layout/style.scss'),
        includePaths: ['node_modules']
      })
      pageStyle = result.css
    } catch (err) {
      this._ctx.log.warn('failed to compile style with Sass', err.message)
      pageStyle = await readFile(require.resolve('milligram'), 'utf-8')
    }
    this._pageCtx = {pageTitle: 'trone', pageStyle}
  }

  _buildBrowserModule(root, comps) {
    return `
import Vue from '/esm/vue'
${comps.map(dcl => `
Vue.component('${dcl.name}', ${JSON.stringify(dcl, null, 2)})\n`)}
new Vue({
  ...${JSON.stringify(root, null, 2)},
  el: 'body>*:first-child'
})
`
  }

  async _loadComponent(filepath) {
    let fileModule = await import(filepath)
    let dcl = {}
    if (!fileModule.default) {
      throw new Error('component must have default export')
    } else if (typeof fileModule.default !== 'object') {
      throw new Error('component default export must be a object')
    } else {
      dcl = {...fileModule.default}
    }
    if (!dcl.name || typeof dcl.name !== 'string') {
      const match = filepath.match(/\/([a-z0-9-]+)\.comp\.js$/)
      if (!match) {
        throw new Error('name property is absent and filepath doesn\'t match name pattern')
      }
      dcl.name = match[1]
    }
    Vue.component(dcl.name, {...dcl})
    return dcl
  }

  async _loadDefaultComponents() {
    const paths = glob.sync(joinPath(__dirname, './layout/*.comp.js'))
    for (const path of paths) {
      const dcl = await this._loadComponent(path)
      this._defaultComponents.push(dcl)
    }
  }

  async render(path = 'default', opts = {}) {
    let dcl
    if (path === 'default') {
      dcl = this._defaultPage
    } else if (this._pages[path]) {
      dcl = this._pages[path]
    } else if (this._globs[path]) {
      this._ctx.log.verbose(`import component '${path}' (${this._globs[path]})`)
      dcl = this._pages[path] = (await import(this._globs[path])).default
    }
    if (opts.data) {
      dcl = deepmerge(dcl, {data: opts.data})
    }
    this._ctx.log.verbose('render data:', dcl.data)
    const pageCtx = {
      ...this._pageCtx,
      ...opts.pageContext,
      browserModule: this._buildBrowserModule(dcl, this._defaultComponents)
    }
    return this._renderer.renderToString(new Vue(dcl), pageCtx)
  }
}

export default async app => {
  const domEngine = new DomEngine(app)
  await domEngine.init()
  app.use((req, res, next) => {
    res.renderPage = (arg1 = 'default', arg2 = {}, arg3 = {}) => {
      if (req.headers.accept && !req.headers.accept.includes('html')) {
        console.warn(`render page although request accept header not includes 'html'`)
      }
      const args = (typeof arg1 === 'string' ? [arg1, arg2, arg3] : ['default', arg1, arg2])
      return domEngine.render(...args).then(html => res.send(html)).catch(err => {
        console.error(err)
        res.send('page renderer error')
      })
    }
    next()
  })
  return domEngine
}
