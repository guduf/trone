import { spawn } from 'child_process'
import chokidar from 'chokidar'

import { join as joinPath } from 'path'

export function watch(command) {
  let {paths} = command
  const watched = []

  for (const key of Object.keys(paths)) {
    if (key !== 'static' && paths[key]) {
      watched.push(paths[key])
    }
  }

  if (!watched.length) {
    console.error('no directory to watch')
    process.exit(1)
  }

  let childProcess = null
  let scheduledRestart = null

  let started = false
  const restartChildProcess = async () => {
    await exitChildProcess()
    try {
      console.log(`Client${started ? 'Res' : 'S'}tart`)
      started = true
      const startPath = joinPath(__dirname, './start.js')
      childProcess = spawn(
        'node',
        ['-e', `require = require('esm')(module, {});require('${startPath}').default(${JSON.stringify(command)})`],
        {stdio: ['ipc', 'inherit', 'inherit']}
      )
    } catch (err) {
      exit('SpawnError', err)
    }
    scheduledRestart = null
  }

  chokidar.watch(watched, {usePolling: true}).on('all', (event, path) => {
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
      childProcess.kill('SIGINT')
    })
  }

  const exit = async (msg, err) => {
    try {
      await exitChildProcess()
    } catch (err) {
      console.error(err)
      console.error('ChildExitError')
    }
    if (err) {
      console.error(err)
      console.error(msg)
    } else {
      console.log(msg)
    }
    process.exit(err ? 1 : 0)
  }

  process.on('SIGINT', () => exit('WatchInterupted'))
}

export default watch
