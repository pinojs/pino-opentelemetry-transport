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

// https://github.com/open-telemetry/opentelemetry-specification/blob/fc8289b8879f3a37e1eba5b4e445c94e74b20359/specification/logs/data-model.md#displaying-severity
const SEVERITY_NAME_MAP = {
  0: 'UNSPECIFIED',
  1: 'TRACE',
  2: 'TRACE2',
  3: 'TRACE3',
  4: 'TRACE4',
  5: 'DEBUG',
  6: 'DEBUG2',
  7: 'DEBUG3',
  8: 'DEBUG4',
  9: 'INFO',
  10: 'INFO2',
  11: 'INFO3',
  12: 'INFO4',
  13: 'WARN',
  14: 'WARN2',
  15: 'WARN3',
  16: 'WARN4',
  17: 'ERROR',
  18: 'ERROR2',
  19: 'ERROR3',
  20: 'ERROR4',
  21: 'FATAL',
  22: 'FATAL2',
  23: 'FATAL3',
  24: 'FATAL4'
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
 * @property {Object.<number, number>} [severityNumberMap]
 *
 * @param {Bindings} sourceObject
 * @param {MapperOptions} mapperOptions
 * @returns {import('@opentelemetry/api-logs').LogRecord}
 */
function toOpenTelemetry (sourceObject, { messageKey, severityNumberMap = {} }) {
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
  const severityText = SEVERITY_NAME_MAP[severityNumber] ?? 'UNSPECIFIED'

  /* eslint-disable camelcase */
  return {
    timestamp: time,
    body: msg,
    severityNumber,
    attributes,
    severityText
  }
}

module.exports = {
  toOpenTelemetry
}
