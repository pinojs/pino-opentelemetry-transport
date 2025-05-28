'use strict'

const process = require('process')
const opentelemetry = require('@opentelemetry/sdk-node')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { PinoInstrumentation } = require('@opentelemetry/instrumentation-pino')
const { resourceFromAttributes } = require('@opentelemetry/resources')
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node')

const traceExporter = new ConsoleSpanExporter()

const instrumentations = [new HttpInstrumentation(), new PinoInstrumentation()]

const sdk = new opentelemetry.NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'Pino OpenTelemetry Example'
  }),
  traceExporter,
  instrumentations
})

sdk.start()

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch(error => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0))
})
