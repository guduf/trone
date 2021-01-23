const { readFileSync } = require('fs')
const Vue = require('vue')
const { createRenderer } = require('vue-server-renderer')
const { join: joinPath } = require('path')

module.exports = class PageEngine {
  constructor(ctx, pages) {
    this._ctx = ctx
    this._defaultTemplate = readFileSync(joinPath(__dirname, './default.template.html'), 'utf-8')
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

  render(path = 'default', opts = {}) {
    let pageCmp
    if (path === 'default') {
      const data = opts.data || {}
      pageCmp = new Vue({
        template: this._defaultTemplate,
        data: {title: data.title, text: data.text}
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
