'use strict'

const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-grpc')
const build = require('pino-abstract-transport')
const { getOtlpLogger } = require('./otlp-logger')

/**
 * Pino OpenTelemetry transport
 *
 * Maps Pino log entries to OpenTelemetry Data model
 *
 * @typedef {Object} Options
 * @property {string} loggerName
 * @property {string} serviceVersion
 * @property {Object} [resourceAttributes={}]
 * @property {boolean} [useBatchProcessor=true]
 * @property {string} [messageKey="msg"]
 * @property {import('@opentelemetry/sdk-logs').LogRecordExporter} [logRecordExporter]
 *
 * @param {Options} opts
 */
module.exports = async function (opts) {
  const logger = getOtlpLogger({
    logRecordExporter: new OTLPLogExporter(),
    ...opts
  })

  return build(
    async function (/** @type { AsyncIterable<Bindings> } */ source) {
      for await (const obj of source) {
        logger.emit(obj)
      }
    },
    {
      async close () {
        return logger.shutdown()
      }
    }
  )
}
