import pino from 'pino'
import { join } from 'path'
// import type { Options } from 'pino-opentelemetry-transport'
import type { Options } from '../../'

const transport = pino.transport<Options>({
  // target: 'pino-opentelemetry-transport',
  target: join(__dirname, '..', '..', 'lib', 'pino-opentelemetry-transport'),
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
    ],
    loggerName: 'test-logger',
    serviceVersion: '1.0.0'
  }
})

const logger = pino(transport)

transport.on('ready', () => {
  setInterval(() => {
    logger.info('test log')
  }, 1000)
})
