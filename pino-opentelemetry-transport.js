'use strict'

const build = require('pino-abstract-transport')
const { getOtlpLogger } = require('./otlp-logger')
const createLogProcessor = require('./create-log-processor')

/**
 * Pino OpenTelemetry transport
 *
 * @typedef {Object} Options
 * @property {string} loggerName
 * @property {string} serviceVersion
 * @property {Object} [resourceAttributes={}]
 * @property {import('./create-log-processor').LogRecordProcessorOptions | import('./create-log-processor').LogRecordProcessorOptions[]} [logRecordProcessorOptions]
 * @property {string} [messageKey="msg"]
 *
 * @param {Options} opts
 */
module.exports = async function ({ logRecordProcessorOptions, ...opts }) {
  const logger = getOtlpLogger({
    ...opts,
    logRecordProcessor: createLogProcessor(logRecordProcessorOptions)
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
