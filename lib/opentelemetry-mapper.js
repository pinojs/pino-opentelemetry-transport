'use strict'

const { SeverityNumber } = require('@opentelemetry/api-logs') // TODO: optional import

/**
 * If the source format has only a single severity that matches the meaning of the range
 * then it is recommended to assign that severity the smallest value of the range.
 * https://github.com/open-telemetry/opentelemetry-specification/blob/fc8289b8879f3a37e1eba5b4e445c94e74b20359/specification/logs/data-model.md#mapping-of-severitynumber
 */
const SEVERITY_NUMBER_MAP = {
  10: SeverityNumber.TRACE,
  20: SeverityNumber.DEBUG,
  30: SeverityNumber.INFO,
  40: SeverityNumber.WARN,
  50: SeverityNumber.ERROR,
  60: SeverityNumber.FATAL
}

// https://github.com/open-telemetry/opentelemetry-specification/blob/fc8289b8879f3a37e1eba5b4e445c94e74b20359/specification/logs/data-model.md#displaying-severity
const SEVERITY_NAME_MAP = {
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
 *
 * @param {Bindings} sourceObject
 * @param {MapperOptions} mapperOptions
 * @returns {import('@opentelemetry/api-logs').LogRecord}
 */
function toOpenTelemetry (sourceObject, { messageKey }) {
  const {
    time,
    level,
    hostname,
    pid,
    [messageKey]: msg,
    ...attributes
  } = sourceObject

  const severityNumber =
    SEVERITY_NUMBER_MAP[sourceObject.level] ?? SeverityNumber.UNSPECIFIED
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
