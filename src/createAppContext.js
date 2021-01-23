const {join: joinPath} = require('path')

const resolvePath = (base, path) => (
  !path || path === 'null' ? null : /^\.{1,2}\//.test(path) ? joinPath(base, path) : path
)

const Logger = require('./logger')

module.exports = function createAppContext(extraConfig = {}) {
  const appDir = extraConfig.appDir || joinPath(__dirname, '..')
  const mode = extraConfig.env || process.env['APP_ENV'] || process.env['NODE_ENV'] || 'production'
  const env = process.env
  const cfg = {
    mode,
    isDev: mode === 'development',
    isProd: mode === 'production',
    httpPort: extraConfig.port || env['APP_HTTP_PORT'] || env['HTTP_PORT'] || env['PORT'] || '8080',
    wsPort: extraConfig.port || env['APP_WS_PORT'] || env['WS_PORT'] || '9090',
    appDir,
    staticDir: resolvePath(appDir, extraConfig.staticDir || env['APP_STATIC_DIR'] || './static'),
    libDir: resolvePath(appDir, extraConfig.libDir || env['APP_LIB_DIR'] || './lib')
  }

  const logger = new Logger({
    env: process.env['APP_LOGGER_ENV'] || cfg.env,
    logDir: resolvePath(appDir, process.env['APP_LOG_DIR'] || './tmp/logs')
  })

  return {...cfg, logger}
}
