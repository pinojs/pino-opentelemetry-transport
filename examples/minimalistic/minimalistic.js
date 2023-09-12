'use strict'

const path = require('path')
const pino = require('pino')

const transport = pino.transport({
  target: path.join(__dirname, '..', '..', 'pino-opentelemetry-transport')
})

const logger = pino(transport)

transport.on('ready', () => {
  setInterval(() => {
    logger.info('test log')
  }, 1000)
})
