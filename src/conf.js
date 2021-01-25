import YAML from 'yaml'
import { readFileSync } from 'fs'
import deepmerge from 'deepmerge'

const {env} = process

const DEFAULT_MODE = env['APP_ENV'] || env['NODE_ENV'] || 'production'

const DEFAULT_CONFIG = {
  mode: DEFAULT_MODE,
  isDev: DEFAULT_MODE === 'development',
  isProd: DEFAULT_MODE === 'production',
  httpPort: env['APP_HTTP_PORT'] || env['HTTP_PORT'] || env['PORT'] || '8080',
  wsPort: env['APP_WS_PORT'] || env['WS_PORT'] || '9090',
  browser: {
    shim: {
      'vue': 'vue/dist/vue.esm.browser.js'
    }
  }
}

export const configBuilder = (confPath, extraConf = {}) => {
  let innerConf
  if (confPath) {
    innerConf = YAML.parse(readFileSync(confPath, 'utf-8'))
  } else {
    innerConf = {}
  }
  return deepmerge(DEFAULT_CONFIG, innerConf, extraConf)
}

export default configBuilder
