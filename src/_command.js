import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

import { isFile, isDirectory, resolvePath } from './_utils'

export const parseCommand = () => {
  const argv = yargs(hideBin(process.argv))
    .command('* [app] [...options]', 'Run trone application', yargs => (
      yargs.positional('app', {type: 'string', describe: 'Directory where to look for subdirectories and configuration\nDefault is current working directory'})
    ))
    .option('watch', {alias: ['w'], type: 'boolean', describe: 'If true, run trone in a child process reloaded at each file change'})
    .option('conf', {alias: 'c', type: 'string', describe: 'Configuration file to apply to process'})
    .option('static', {alias: 's', type: 'string', describe: 'Directory where content will be statically served'})
    .option('lib', {alias: 'l', type: 'string', describe: 'Directory where to look for files like middlewares or pages'})
    .option('overSrc', {alias: ['src'], type: 'string', describe: 'Directory that will overwrite original source files'})
    .option('verbose', {alias: ['v'], type: 'boolean', describe: 'If true, logger will print all possible messages'})
    .help('help')
    .alias('help', 'h')
    .argv
  const cwd = process.cwd()
  const appDir = argv.app ? resolvePath(cwd, argv.app) : cwd
  const resolveAppPath = path => resolvePath(appDir || cwd, path)
  let conf = argv.conf ? resolvePath(cwd, argv.conf) : ''
  if (conf != null && !conf && isFile(resolveAppPath('./conf.yaml'))) {
    conf = resolveAppPath('./conf.yaml')
  }
  let src = argv.overSrc ? resolvePath(cwd, argv.overSrc) : ''
  if (src != null && !src && isDirectory(resolveAppPath('./src/'))) {
    src = resolveAppPath('./src')
  }
  let lib = argv.lib ? resolvePath(cwd, argv.lib) : ''
  if (lib != null && !lib && isDirectory(resolveAppPath('./lib'))) {
    lib = resolvePath(appDir, './lib')
  }
  let _static = argv.static ? resolvePath(cwd, argv.static) : ''
  if (_static != null && !_static && isDirectory(resolveAppPath('./static'))) {
    _static = resolvePath(appDir, './static')
  }
  const {verbose, watch} = argv
  return {paths: {conf: conf, src, lib, static: _static}, verbose, watch}
}

export default parseCommand
