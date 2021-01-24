const { readFileSync } = require('fs')
const Vue = require('vue')
const { createRenderer } = require('vue-server-renderer')
const { join: joinPath } = require('path')
const glob = require('glob')

const DEFAULT_PAGE_DCL = {
  template: `
    <default-layout v-bind:content="layoutContent">
      {{ pageContent }}
    </default-layout>
  `,
  data: {
    layoutContent: {
      title: 'trone'
    },
    pageContent: 'Hello World!'
  }
}

module.exports = class PageEngine {
  constructor(ctx, pages) {
    this._ctx = ctx
    this._loadDefaultComponents()
    this._renderer = createRenderer({
      template: readFileSync(joinPath(__dirname, './index.template.html'), 'utf-8')
    })
    let pageStyle
    try {
      pageStyle = require('sass').renderSync({
        file: joinPath(__dirname, './style.scss'),
        includePaths: ['node_modules']
      }).css
    } catch (err) {
      ctx.logger.warn('failed to compile style with Sass', err.message)
      pageStyle = readFileSync(require.resolve('milligram'), 'utf-8')
    }

    this._pageCtx = {pageTitle: 'trone', pageStyle}

    this._pages = pages
  }

  _loadComponent(filepath) {
    let dcl = require(filepath)
    if (!dcl) {
      throw new Error('component declaration is falsy')
    } else if (typeof dcl !== 'object') {
      throw new Error('component declaration must be a object')
    } else {
      dcl = {...dcl}
    }
    let name
    if (dcl.name && typeof dcl.name === 'string') {
      name = dcl.name
      delete dcl.name
    } else if (filepath.endsWith('/index.comp.js')) {
      const match = filepath.match(/\/([a-z0-9-]+)\.comp\.js$/)
      if (!match) {
        throw new Error('name property is absent and filepath doesn\'t match name pattern')
      }
    } else {
      const match = filepath.match(/\/([a-z0-9-]+)\.comp\.js$/)
      if (!match) {
        throw new Error('name property is absent and filepath doesn\'t match name pattern')
      }
      name = match[1]
    }
    console.log(name, dcl)
    Vue.component(name, dcl)
  }

  _loadDefaultComponents() {
    const paths = glob.sync(joinPath(__dirname, './layout/*.comp.js'))
    for (const path of paths) {
      this._loadComponent(path)
    }
  }

  render(path = 'default', opts = {}) {
    let pageCmp
    if (path === 'default') {
      const data = opts.data || {}
      pageCmp = new Vue({
        ...DEFAULT_PAGE_DCL
      })
    } else if (this._pages[path]) {
      pageCmp = this._pages[path]
    } else {
      throw new Error(`page component not found for path '${path}'`)
    }
    const pageCtx = {...this._pageCtx, ...opts.pageContext}
    return this._renderer.renderToString(pageCmp, pageCtx)
  }
}
