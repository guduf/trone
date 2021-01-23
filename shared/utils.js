const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { existsSync } = require('fs')
const { join: joinPath } = require('path')
const { describe } = require('yargs')

const resolvePath = (base, path) => (
  !path || path == 'null' ? null : /^\.{1,2}((\/|\\).*)?$/.test(path) ? joinPath(base, path) : path
)

const parseCommand = () => {
  const argv = yargs(hideBin(process.argv))
    .command('* [app] [...options]', 'Run trone application', yargs => (
      yargs.positional('app', {type: 'string', describe: 'Directory where to look for the subdirectories and the configuration\nDefault is current working directory'})
    ))
    .option('watch', {alias: ['w'], type: 'boolean', describe: 'If true, run trone in a child process reloaded at each file change'})
    .option('static', {alias: 's', type: 'string', describe: 'Directory where the content will be statically served'})
    .option('lib', {alias: 'l', type: 'string', describe: 'Directory where to look for the files like middlewares or pages'})
    .option('overSrc', {alias: ['src'], type: 'string', describe: 'Directory that will overwrite the original source files'})
    .help('help')
    .alias('help', 'h')
    .argv
  const cwd = process.cwd()
  const appDir = argv.app ? resolvePath(cwd, argv.app) : null
  const resolveAppPath = path => resolvePath(appDir || cwd, path)
  let src = argv.overSrc ? resolvePath(cwd, argv.overSrc) : null
  if (!src && appDir && existsSync(resolveAppPath('./src/'))) {
    src = resolveAppPath('./src')
  }
  let lib = argv.libDir ? resolvePath(cwd, argv.libDir) : null
  if (!lib && appDir && existsSync(resolveAppPath('./lib/'))) {
    lib = resolvePath(appDir, './lib')
  }
  let static = argv.staticDir ? resolvePath(cwd, argv.staticDir) : null
  if (!static && appDir && existsSync(resolveAppPath('./static/'))) {
    static = resolvePath(appDir, './static')
  }
  return {paths: {src, lib, static}, watch: argv.watch}
}

module.exports = {parseCommand, resolvePath}
