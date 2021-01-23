const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { existsSync } = require('fs')
const { join: joinPath } = require('path')

const resolvePath = (base, path) => (
  !path || path == 'null' ? null : /^\.{1,2}((\/|\\).*)?$/.test(path) ? joinPath(base, path) : path
)

const parseCommand = () => {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('app', {alias: ['a'], type: 'string'})
    .option('static', {alias: 's', type: 'string'})
    .option('lib', {alias: 'l', type: 'string'})
    .option('overSrc', {alias: ['o', 'src'], type: 'string'})
    .help('help')
    .alias('help', 'h')
    .argv
  const cwd = process.cwd()
  const appDir = argv.app ? resolvePath(cwd, argv.app) : null
  const resolveAppPath = path => resolvePath(appDir || cwd, path)
  let srcDir = argv.overSrc ? resolvePath(cwd, argv.overSrc) : null
  if (!srcDir && appDir && existsSync(resolveAppPath('./src/'))) {
    srcDir = resolveAppPath('./src')
  }
  let libDir = argv.libDir ? resolvePath(cwd, argv.libDir) : null
  if (!libDir && appDir && existsSync(resolveAppPath('./lib/'))) {
    libDir = resolvePath(appDir, './lib')
  }
  let staticDir = argv.staticDir ? resolvePath(cwd, argv.staticDir) : null
  if (!staticDir && appDir && existsSync(resolveAppPath('./static/'))) {
    staticDir = resolvePath(appDir, './static')
  }
  return {srcDir, libDir, staticDir}
}

module.exports = {parseCommand, resolvePath}
