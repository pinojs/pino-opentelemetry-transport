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
 *
 * @param {Options} opts
 */
module.exports = async function (opts) {
  const logger = getOtlpLogger({
    ...opts,
    logRecordExporter: new OTLPLogExporter()
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
