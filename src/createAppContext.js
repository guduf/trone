const {join: joinPath} = require('path')

const resolvePath = (base, path) => (
  !path || path === 'null' ? null : /^\.{1,2}\//.test(path) ? joinPath(base, path) : path
)

const Logger = require('./logger')

module.exports = function createAppContext(cmd) {
  const mode = process.env['APP_ENV'] || process.env['NODE_ENV'] || 'production'
  const env = process.env
  const cfg = {
    ...cmd,
    mode,
    isDev: mode === 'development',
    isProd: mode === 'production',
    httpPort: env['APP_HTTP_PORT'] || env['HTTP_PORT'] || env['PORT'] || '8080',
    wsPort: env['APP_WS_PORT'] || env['WS_PORT'] || '9090',
  }

  const logger = new Logger({
    env: process.env['APP_LOGGER_ENV'] || cfg.env
  })

  return {...cfg, logger}
}
