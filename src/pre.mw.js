export default app => {
  app.get('/healthz?', (req, res) => res.renderPage({data: {title: 'Health Probe'}}))

  app.use('/robots.txt', (req, res) => {
    res.type('text/plain')
    res.send('User-agent: *\nDisallow: /')
  })
}
