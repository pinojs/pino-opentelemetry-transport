'use strict'

const process = require('process')
const opentelemetry = require('@opentelemetry/sdk-node')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { PinoInstrumentation } = require('@opentelemetry/instrumentation-pino')
const { Resource } = require('@opentelemetry/resources')
// const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node')
const {
  SemanticResourceAttributes
} = require('@opentelemetry/semantic-conventions')

const traceExporter = new ConsoleSpanExporter()
// const traceExporter = new OTLPTraceExporter()

const instrumentations = [
  new HttpInstrumentation(),
  new PinoInstrumentation()
]

const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'Pino OpenTelemetry Example'
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
