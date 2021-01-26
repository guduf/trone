import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import parseCommand from '../src/_command'
import start from './start'
import watch from './watch'

yargs(hideBin(process.argv))
  .scriptName('trone')
  .usage('$0 <cmd> [opts] [app]', '', yargs => (
    yargs.positional('app', {type: 'string', describe: 'Directory where to look for subdirectories and configuration\nDefault is current working directory'})
  ))
  .command(['*', 'start'], 'run trone locally', yargs => yargs, argv => (
    !process.connected && argv.watch ? watch : start)(parseCommand(argv)
  ))
  .option('watch', {alias: ['w'], type: 'boolean', describe: 'If true, run trone in a child process reloaded at each file change'})
  .option('conf', {alias: 'c', type: 'string', describe: 'Configuration file injected into application'})
  .option('static', {alias: 's', type: 'string', describe: 'Directory where content will be statically served'})
  .option('lib', {alias: 'l', type: 'string', describe: 'Directory where to look for files like middlewares or pages'})
  .option('overSrc', {alias: ['src'], type: 'string', describe: 'Directory that will overwrite original source files'})
  .option('verbose', {alias: ['v'], type: 'boolean', describe: 'If true, logger will print all possible messages'})
  .option('dryRun', {type: 'boolean', describe: 'Process will close just before it should start to listen'})
  .help('help')
  .alias('help', 'h')
  .argv
