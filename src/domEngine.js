import { readFile } from 'fs'
import Vue from 'vue'
import { createRenderer } from 'vue-server-renderer'
import { join as joinPath, dirname } from 'path'
import glob from 'glob'
import { promisify as p } from 'util'
import deepmerge from 'deepmerge'

const DEFAULT_PAGE_DCL = {
  template: `
    <default-layout v-bind:content="layoutContent">
      <h2>{{ title }}</h2>
    </default-layout>
  `,
  data: {
    layoutContent: {},
    title: 'Hello world !'
  }
}

class DomEngine {
  constructor(ctx) {
    this._ctx = ctx
  }

  static _modPathReg = /^(import\s+(?:(?:(?:\w+)|(?:{[\S\s]*?}))\s+from\s+)?['"])((?!\.{1,2})\S+['"]\s*;?\s*)$/gm
  static _replaceModuleImports(body) {
    return body.replace(DomEngine._modPathReg, '$1/modules/$2')
  }

  _defaultComponents = []

  async init() {
    await this._loadDefaultComponents()
    this._renderer = createRenderer({
      template: await p(readFile)(joinPath(__dirname, './layout/index.template.html'), 'utf-8')
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
      pageStyle = await p(readFile)(require.resolve('milligram'), 'utf-8')
    }
    this._pageCtx = {pageTitle: 'trone', pageStyle}
  }

  _buildBrowserModule(root, comps) {
    return DomEngine._replaceModuleImports(`
import Vue from 'vue'
${comps.map(dcl => `
Vue.component('${dcl.name}', ${JSON.stringify(dcl, null, 2)})`)}

new Vue({
  ...${JSON.stringify(root, null, 2)},
  el: 'body>*:first-child'
})
`)
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

  async renderScript(req, res, next) {
    const path = req.params[0].replace(/\.js$/, '')
    if (!path) {
      res.setHeader('content-type', 'text/javascript')
      res.send(this._browserModule)
      return
    }
    let filepath
    const {shim} = this._ctx.conf.browser
    if (shim[path]) {
      filepath = require.resolve(shim[path])
    } else try {
      const pkgPath = require.resolve(`${path}/package.json`)
      const module = require(pkgPath).module
      if (!module) {
        throw new Error('module not found')
      }
      filepath = joinPath(dirname(pkgPath), module)
    } catch (err) {
      res.status(404)
      next(err)
      return
    }
    res.sendFile(filepath)
  }

  render(path = 'default', opts = {}) {
    let dcl
    if (path === 'default') {
      dcl = deepmerge(DEFAULT_PAGE_DCL, opts.data ? {data: opts.data} : {})
    } else {
      throw new Error(`not implemented`)
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
  app.get('/modules/?*', (req, res, next) => domEngine.renderScript(req, res, next))
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
