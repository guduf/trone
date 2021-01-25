import { readFile } from 'fs-extra'

export class EsmRegistry {
  static _modPathReg = /^(import\s+(?:(?:(?:\w+)|(?:{[\S\s]*?}))\s+from\s+)?['"])((?!\.{1,2})\S+['"]\s*;?\s*)$/gm
  static replaceImports(body) {
    return body.replace(EsmRegistry._modPathReg, '$1/modules/$2')
  }

  constructor(ctx) {
    this._ctx = ctx
  }

  _files = {}

  async  getFilepath(path) {
    const shim = this._ctx.conf.browser.shim || {}
    let filename = null
    if (this._files[path]) {
      return this._files[path]
    } else if (shim[path]) {
      filename = require.resolve(shim[path])
    } else {
      const pkgPath = require.resolve(`${path}/package.json`)
      const module = require(pkgPath).module
      if (!module) {
        throw new Error('module propery not found')
      }
      filename = joinPath(dirname(pkgPath), module)
    }
    if (!filename) {
      throw new Error('module not found')
    }
    const raw = await readFile(filename, 'utf-8')
    this._files[path] = EsmRegistry.replaceImports(raw)
    return this._files[path]
  }
}

export const esmMiddleware = async app => {
  const registry = new EsmRegistry(app)
  app.get('/esm/?*', (req, res, next) => {
    const path = req.params[0].replace(/\.js$/, '')
    if (!path) {
      res.setHeader('content-type', 'text/javascript')
      res.send(this._browserModule)
      return
    }
    let file
    try {
      file = registry.getFilepath(path)
    } catch (err) {
      next(err)
      return
    }
    res.send(file)
  })
}

export default esmMiddleware
