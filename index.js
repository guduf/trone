const fse = require('fs-extra')

const { parseCommand, resolvePath } = require('./shared/utils')

const cmd = parseCommand()

const DEFAULT_SRC_DIR = resolvePath(__dirname, './src')

let tmpDir = undefined
if (!cmd.paths.src) {
  cmd.paths.src = DEFAULT_SRC_DIR
} else if (cmd.paths.src !== DEFAULT_SRC_DIR) {
  tmpDir = resolvePath(__dirname, `./tmp/src-${Date.now()}-${process.pid}`)
  fse.copySync(DEFAULT_SRC_DIR, tmpDir)
  fse.copySync(cmd.paths.src, tmpDir)
  src = tmpDir
}

const createApp = require(resolvePath(cmd.paths.src, './createApp'))
const createAppContext = require(resolvePath(cmd.paths.src, './createAppContext'))
const bootstrap = require(resolvePath(cmd.paths.src, './bootstrap'))

let appContext

try {
  appContext = createAppContext(cmd)
} catch (err) {
  console.error(err)
  console.error('CreateAppContextFailure')
  process.exit(1)
}

let app
try {
  app = createApp(appContext)
} catch (err) {
  console.error(err)
  console.error('CreateAppFailure')
  process.exit(1)
}

const exit = (msg, err) => {
  if (tmpDir) {
    try {
      fse.removeSync(tmpDir)
    } catch (err) {
      console.error(err)
    }
  }
  try {
    app.stop()
  } catch (err) {
    exit('StopAppError', err)
    return
  }
  setTimeout(() => {
    if (err) {
      console.error(err)
      console.error(msg)
    } else {
      console.log(msg)
    }
    process.exit(err ? 0 : 1)
  })
}

bootstrap(app).catch(err => {
  try {
    app.stop()
  } catch (err) {
    setTimeout(() => {
      console.error(err)
      console.error('StopAppError')
    })
  }
  exit('BootstrapError', err)
})

if (process.connected) {
  process.on('disconnect', () => exit('Disconnected'))
  process.on('SIGINT', () => { return })
} else {
  process.on('SIGINT', () => exit('Interupted'))
}

