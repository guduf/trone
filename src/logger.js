export class Logger {
  constructor({command}) {
    if (!command.verbose) {
      this.verbose = () => {}
    }
  }

  info(...args) {
    console.log('INFO ', ...args)
  }

  warn(...args) {
    console.log('WARN ', ...args)
  }

  error(...args) {
    console.error('ERROR ', ...args)
  }

  verbose(...args) {
      console.error(...args)
  }
}

export default (...args) => new Logger(...args)
