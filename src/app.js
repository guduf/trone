import express from 'express'

export default function createApp(ctx) {
  const {httpPort} = ctx.conf
  if (!(httpPort > 0)) {
    throw new Error('missing httpPort')
  }

  const app = express()

  let server

  Object.assign(app, {
    ...ctx,
    start: () => new Promise(resolve => {
      app.listen(httpPort, () => {
        app.emit('appStart')
        ctx.log.info(`app start on :${httpPort}`)
        resolve()
      })
    }),
    stop: () => {
      app.emit('appStop')
      ctx.log.info(`app stop on :${httpPort}`)
      return new Promise(resolve => {
        if (server) {
          setTimeout(() => {
            try { server.close() } catch (err) { ctx.log.error('server close error', err) }
            resolve()
          })
          return
        }
        resolve()
      })
    }
  })
  return app
}
