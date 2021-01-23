const express = require('express')

module.exports = function createApp(ctx) {
  const app = express()
  app.context = ctx
  app.info = function (...args) {
    this.context.logger.info(...args)
  }
  app.warn = function (...args) {
    this.context.logger.warn(...args)
  }
  app.error = function (...args) {
    this.context.logger.error(...args)
  }
  let server
  app.start = function () {
    server = this.listen(ctx.httpPort, () => {
      this.emit('appStart')
      ctx.logger.info(`app start on :${ctx.httpPort}`)
    })
  }
  app.stop = function () {
    this.emit('appStop')
    ctx.logger.info(`app stop on :${ctx.httpPort}`)
    return new Promise(resolve => {
      if (server) {
        setTimeout(() => {
          try {
            server.close()
          } catch (err) {
            ctx.logger.error('server close error', err)
          }
          resolve()
        })
        return
      }
      resolve()
    })
  }
  return app
}
