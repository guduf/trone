const { spawn } = require('child_process')
const chokidar = require('chokidar')

const { parseCommand, resolvePath } = require('./utils')

let {paths: {src, lib, static}} = parseCommand()

const watched = []
let childArgs = [resolvePath(__dirname, '../index.js')]

if (src) {
  const srcDir = resolvePath(process.cwd(), src)
  watched.push(srcDir)
  childArgs.push('--src', srcDir)
}

if (lib) {
  const libDir = resolvePath(process.cwd(), lib)
  watched.push(libDir)
  childArgs.push('--lib', libDir)
}

if (static) {
  childArgs.push('--static', resolvePath(process.cwd(), static))
}

if (!watched.length) {
  console.error('no directory to watch')
  process.exit(1)
}

let childProcess = null
let scheduledRestart = null

const restartChildProcess = async () => {
  await exitChildProcess()
  try {
    console.log('Restart')
    childProcess = spawn('node', childArgs, {stdio: ['ipc', 'inherit', 'inherit']})
  } catch (err) {
    exit('SpawnError', err)
  }
  scheduledRestart = null
}

chokidar.watch(watched).on('all', (event, path) => {
  if (scheduledRestart) {
    return
  }
  scheduledRestart = setTimeout(restartChildProcess, 200)
})

const exitChildProcess = () => {
  if (!childProcess || childProcess.exitCode != null) {
    return
  }
  return new Promise(resolve => {
    childProcess.on('exit', resolve)
    if (childProcess.connected) {
      childProcess.disconnect()
    } else {
      childProcess.kill('SIGINT')
    }
  })
}

const exit = async (msg, err) => {
  try {
    await exitChildProcess()
  } catch (err) {
    console.error(err)
    console.error('ExitError')
  }
  if (err) {
    console.error(err)
    console.error(msg)
  } else {
    console.log(msg)
  }
  process.exit(err ? 1 : 0)
}

process.on('SIGINT', () => exit('Interupted'))
