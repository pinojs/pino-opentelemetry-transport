'use strict'

const build = require('pino-abstract-transport')
const { getOtlpLogger } = require('otlp-logger')
const { toOpenTelemetry } = require('./opentelemetry-mapper')
const DEFAULT_MESSAGE_KEY = 'msg'

/**
 * Pino OpenTelemetry transport
 *
 * @typedef {Object} PinoOptions
 * @property {string} [messageKey="msg"]
 * @property {Object.<number, number>} [severityNumberMap]
 *
 * @typedef {PinoOptions & import('otlp-logger').Options} Options
 *
 * @param { Options } opts
 */
module.exports = async function ({ messageKey = DEFAULT_MESSAGE_KEY, severityNumberMap, ...loggerOpts }) {
  const logger = getOtlpLogger(loggerOpts)

  const mapperOptions = {
    messageKey,
    severityNumberMap
  }

  return build(
    async function (/** @type { AsyncIterable<Bindings> } */ source) {
      for await (const obj of source) {
        logger.emit(toOpenTelemetry(obj, mapperOptions))
      }
    },
    {
      async close () {
        return logger.shutdown()
      }
    }
  )
}
