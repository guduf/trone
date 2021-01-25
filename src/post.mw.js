import { getReasonPhrase } from 'http-status-codes'

export const postMiddleware = app => {
  const defaultHander = (req, res, data = {}) => {
    data = {...data}
    const {accept} = req.headers
    if (!accept || accept.includes('html')) {
      res.renderPage({data})
    } else if (accept.includes('json')) {
      res.send(data)
    } else {
      res.end()
    }
  }

  app.use((req, res) => {
    let status = req.statusCode
    if (!req.statusCode) {
      res.status(status = 404)
    }
    defaultHander(req, res, {title: getReasonPhrase(status), status})
  })

  app.use((err, req, res) => {
    let text = ''
    if (res.statusCode < 399) {
      res.status(500)
    }
    if (res.statusCode != 404 || err.message != 'Not Found') {
      console.error(err)
      if (app.conf.isDev) {
        text = err.stack
      }
    }
    defaultHander(req, res, {
      title: getReasonPhrase(res.statusCode),
      status: res.statusCode,
      content: text
    })
  })
}

export default postMiddleware
