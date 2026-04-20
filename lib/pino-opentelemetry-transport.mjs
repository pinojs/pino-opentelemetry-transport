import build from 'pino-abstract-transport'
import { getOtlpLogger } from 'otlp-logger'
import { toOpenTelemetry } from './opentelemetry-mapper.js'


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
export default async function ({ severityNumberMap, ...loggerOpts } = {}) {
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
      async close() {
        return logger.shutdown()
      },
      expectPinoConfig: true
    }
  )
}

export function getBuildPath() {
  return import.meta.filename
}



