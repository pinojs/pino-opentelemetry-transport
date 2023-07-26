const pino = require('pino')

const transport = pino.transport({
  target: '.'
})

const logger = pino(transport)

transport.on('ready', () => {
  setInterval(() => {
    logger.info('test log')
  }, 1000)
})
