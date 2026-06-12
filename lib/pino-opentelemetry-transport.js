'use strict'

const build = require('pino-abstract-transport')
const { getOtlpLogger } = require('./otlp-logger-shim')
const { toOpenTelemetry } = require('./opentelemetry-mapper')

/**
 * Pino OpenTelemetry transport
 *
 * @typedef {Object} PinoOptions
 * @property {Object.<number, number>} [severityNumberMap]
 *
 * @typedef {import('./otlp-logger-shim').OtlpLoggerOptions & PinoOptions} Options
 *
 * @param {Options} opts
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
