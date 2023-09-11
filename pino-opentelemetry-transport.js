'use strict'

const build = require('pino-abstract-transport')
const { getOtlpLogger } = require('./otlp-logger')

/**
 * Pino OpenTelemetry transport
 *
 * @typedef {Object} Options
 * @property {string} loggerName
 * @property {string} serviceVersion
 * @property {Object} [resourceAttributes={}]
 * @property {import('@opentelemetry/sdk-logs').LogRecordProcessor} [logRecordProcessor]
 * @property {LogRecordProcessorOptions} [logRecordProcessorOptions]
 * @property {string} [messageKey="msg"]
 *
 * @param {Options} opts
 */
module.exports = async function (opts) {
  const logger = getOtlpLogger(opts)

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
