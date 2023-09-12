'use strict'

const pino = require('pino')
const path = require('path')

const transport = pino.transport({
  target: path.join(__dirname, '..', '..', 'pino-opentelemetry-transport'),
  options: {
    logRecordProcessorOptions: [
      { recordProcessorType: 'batch', exporterOptions: { protocol: 'http' } },
      {
        recordProcessorType: 'batch',
        exporterOptions: {
          protocol: 'grpc',
          grpcExporterOptions: {
            headers: { foo: 'some custom header' }
          }
        }
      },
      {
        recordProcessorType: 'simple',
        exporterOptions: { protocol: 'console' }
      }
    ]
  }
})

const logger = pino(transport)

transport.on('ready', () => {
  setInterval(() => {
    logger.info('test log')
  }, 1000)
})
