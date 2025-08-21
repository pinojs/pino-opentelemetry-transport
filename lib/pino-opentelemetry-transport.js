'use strict'

const build = require('pino-abstract-transport')
const { getOtlpLogger } = require('otlp-logger')
const { toOpenTelemetry } = require('./opentelemetry-mapper')

/**
 * Pino OpenTelemetry transport
 *
 * @typedef {Object} PinoOptions
 * @property {Object.<number, number>} [severityNumberMap]
 *
 * @typedef {PinoOptions & import('otlp-logger').Options} Options
 *
 * @param { Options } opts
 */
module.exports = async function ({ severityNumberMap, ...loggerOpts } = {}) {
  const logger = getOtlpLogger(loggerOpts)

  return build(
    async function (/** @type { AsyncIterable<Bindings> } */ source) {
      const mapperOptions = {
        messageKey: source.messageKey,
        levels: source.levels,
        severityNumberMap
      }
      for await (const obj of source) {
        logger.emit(toOpenTelemetry(obj, mapperOptions))
      }
    },
    {
      async close () {
        return logger.shutdown()
      },
      expectPinoConfig: true
    }
  )
}
