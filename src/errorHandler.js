const {getReasonPhrase} = require('http-status-codes')

module.exports = (ctx, err, req, res) => {
  let text = ''
  if (res.statusCode < 399) {
    res.status(500)
  }
  if (res.statusCode != 404 || err.message != 'Not Found') {
    console.error(err)
    if (ctx.mode === 'development') {
      text = err.stack
    }
  }
  const data = {
    title: getReasonPhrase(res.statusCode),
    status: res.statusCode,
    text
  }
  if (req.headers.accept && !req.headers.accept.includes('html')) {
    if (req.headers.accept.includes('json')) {
      res.send(data)
      return
    }
    res.end()
    return
  }
  res.renderPage({data})
}
