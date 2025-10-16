'use strict'

/**
 * If the source format has only a single severity that matches the meaning of the range
 * then it is recommended to assign that severity the smallest value of the range.
 * https://github.com/open-telemetry/opentelemetry-specification/blob/fc8289b8879f3a37e1eba5b4e445c94e74b20359/specification/logs/data-model.md#mapping-of-severitynumber
 */
const DEFAULT_SEVERITY_NUMBER_MAP = {
  10: 1, // TRACE
  20: 5, // DEBUG
  30: 9, // INFO
  40: 13, // WARN
  50: 17, // ERROR
  60: 21 // FATAL
}

/**
 * @typedef {Object} CommonBindings
 * @property {string=} msg
 * @property {number=} level
 * @property {number=} time
 * @property {string=} hostname
 * @property {number=} pid
 *
 * @typedef {Record<string, string | number | Object> & CommonBindings} Bindings
 *
 */

/**
 * Converts a pino log object to an OpenTelemetry log object.
 *
 * @typedef {Object} MapperOptions
 * @property {string} messageKey
 * @property {import('pino').LevelMapping} levels
 * @property {Object.<number, number>} [severityNumberMap]
 *
 * @param {Bindings} sourceObject
 * @param {MapperOptions} mapperOptions
 * @returns {import('@opentelemetry/api-logs').LogRecord}
 */
function toOpenTelemetry (sourceObject, { messageKey, levels, severityNumberMap = {} }) {
  const {
    time,
    level,
    hostname,
    pid,
    [messageKey]: msg,
    ...attributes
  } = sourceObject

  const severityNumber =
    severityNumberMap[sourceObject.level] ?? DEFAULT_SEVERITY_NUMBER_MAP[sourceObject.level] ?? 0
  const severityText = levels.labels[sourceObject.level]

  return {
    timestamp: time,
    body: msg,
    severityNumber,
    attributes,
    severityText
  }
}

module.exports = {
  DEFAULT_SEVERITY_NUMBER_MAP,
  toOpenTelemetry
}
