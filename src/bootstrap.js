const express = require('express')
const path = require('path')
const morgan = require('morgan')
const glob = require('glob')

const errorHandler = require('./errorHandler')
const PageEngine = require('./pageEngine/pageEngine')

module.exports = async function bootstrap(app) {
  app.get('/healthz', (req, res) => res.status(200).end())

  app.use('/robots.txt', (req, res, next) => {
    res.type('text/plain')
    res.send('User-agent: *\nDisallow: /')
  })

  const pageEngine = new PageEngine(app.context)
  app.use(morgan('combined'), (req, res, next) => {
    res.renderPage = (arg1 = 'default', arg2 = {}, arg3 = {}) => {
      if (req.headers.accept && !req.headers.accept.includes('html')) {
        console.warn(`render page although request accept header not includes 'html'`)
      }
      const args = (typeof arg1 === 'string' ? [arg1, arg2, arg3] : ['default', arg1, arg2])
      return pageEngine.render(...args).then(html => res.send(html)).catch(err => {
        console.error(err)
        res.send('page renderer error')
      })
    }
    next()
  })

  const {staticDir, libDir} = app.context
  if (staticDir) {
    app.use(express.static(staticDir))
  }

  const mvFiles = glob.sync(`${libDir}/**/*.mv.js`)
  if (!mvFiles.length) {
    app.warn('no middlewares')
  }
  for (const mwFile of mvFiles) {
    app.info(`load middleware '${mwFile}'`)
    try {
      await require(mwFile)(app)
    } catch (err) {
      app.error(err)
    }
  }

  app.use((req, res) => {
    res.status(404)
    throw new Error('Not Found')
  })

  app.use((err, req, res, next) => errorHandler(app.context, err, req, res))

  app.start()
}

