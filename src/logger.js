module.exports = class Logger {
  constructor()  {}

  info(...args) {
    console.log('INFO ', ...args)
  }

  warn(...args) {
    console.log('WARN ', ...args)
  }

  error(...args) {
    console.error('ERROR ', ...args)
  }
}
