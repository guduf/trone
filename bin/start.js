import express from 'express'
import fse from 'fs-extra'
import glob from 'glob'

import { resolvePath } from '../src'

export function start(command) {
  let tmpDir = undefined
  let app = undefined

  const DEFAULT_SRC_DIR = resolvePath(__dirname, '../src')
  if (!command.paths.src) {
    command.paths.src = DEFAULT_SRC_DIR
  } else if (command.paths.src !== DEFAULT_SRC_DIR) {
    tmpDir = resolvePath(__dirname, `./tmp/src-${Date.now()}-${process.pid}`)
    fse.copySync(DEFAULT_SRC_DIR, tmpDir)
    fse.copySync(command.paths.src, tmpDir)
    command.paths.src = tmpDir
  }
  if (command.verbose) {
    console.log(`command:`, command)
  }

  const callSrc = async (path, ...args) => {
    if (command.verbose) {
      console.log(`import source module '${path}'`)
    }
    const mod = await import(resolvePath(command.paths.src, `./${path}`))
    return await mod.default(...args)
  }

  const bootstrap = async () => {
    const conf = await callSrc('conf', command.paths.conf)
    if (command.verbose) {
      console.log(`conf:`, conf)
    }
    const logger = await callSrc('logger', {command, conf})
    app = await callSrc('app', {command, conf, log: logger})
    await callSrc('domEngine', app)
    await callSrc('esm.mw', app)
    await callSrc('pre.mw', app)

    const {paths} = app.command

    if (paths.lib) {
      const mvFiles = glob.sync(`${paths.lib}/**/*.mw.js`)
      if (!mvFiles.length) {
        app.log.warn('no middlewares')
      }
      for (const mwFile of mvFiles) {
        app.log.info(`load middleware '${mwFile}'`)
        try {
          await (await import(mwFile)).default(app)
        } catch (err) {
          app.log.error(err)
        }
      }
    }

    if (paths.static) {
      app.use(express.static(paths.static))
    }

    await callSrc('post.mw', app)

    await app.start()
  }

  let exited = false

  const exit = (msg, err) => {
    if (exited) {
      if (err) { console.error(err) }
      return
    }
    exited = true
    if (tmpDir) try { fse.removeSync(tmpDir) } catch (err) { console.error(err) }
    if (app) try { app.stop() } catch (err) {
      exit('StopAppError', err)
      return
    }
    setTimeout(() => {
      if (err) { console.error(err, '\n', msg) } else if (command.verbose) { console.log(msg) }
      process.exit(err ? 0 : 1)
    })
  }

  bootstrap().catch(err => exit('Fatal', err))
  process.on('disconnect', () => exit('Disconnected'))
  process.on('SIGINT', () => exit('Interupted'))
}

export default start
