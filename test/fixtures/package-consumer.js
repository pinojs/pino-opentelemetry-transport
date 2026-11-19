'use strict'

const assert = require('node:assert/strict')
const { once } = require('node:events')
const { join } = require('node:path')
const pino = require('pino')

async function main () {
  assert.ok(require.resolve('pino-opentelemetry-transport').startsWith(join(__dirname, 'node_modules')))
  const transport = pino.transport({
    target: 'pino-opentelemetry-transport',
    options: {
      loggerName: 'packed-consumer',
      serviceVersion: '1.2.3',
      resourceAttributes: { 'service.name': 'packed-consumer-service' },
      logRecordProcessorOptions: {
        recordProcessorType: 'batch',
        // Shutdown must flush these records before the scheduled export.
        processorConfig: { scheduledDelayMillis: 60000 },
        exporterOptions: {
          protocol: 'http',
          httpExporterOptions: { url: process.argv[2] }
        }
      }
    }
  })
  const logger = pino(transport)
  await once(transport, 'ready')
  const closed = once(transport, 'close')
  const traceId = '12345678901234567890123456789012'
  const spanId = '1234567890123456'
  logger.info({ trace_id: traceId, span_id: spanId, trace_flags: '01', extra: 'retained' }, 'correlated record')
  logger.error('last buffered record')
  transport.end()
  await closed
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
