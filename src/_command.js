import { isFile, isDirectory, resolvePath } from './_util'

export const parseCommand = argv => {
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
  const {verbose, watch, dryRun} = argv
  return {paths: {conf: conf, src, lib, static: _static}, verbose, watch, dryRun}
}

export default parseCommand
