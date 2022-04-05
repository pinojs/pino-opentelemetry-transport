'use strict'

const build = require('pino-abstract-transport')

const SonicBoom = require('sonic-boom')
const { once } = require('events')

module.exports = async function (opts) {
  const destination = new SonicBoom({ dest: opts.destination || 1, sync: false })

  // TODO: add correct type
  return build(async function (source) {
    for await (const obj of source) {
      const updatedLine = JSON.stringify(toOpenTelemetry(obj)) + '\n'
      const writeResult = destination.write(updatedLine)
      const toDrain = !writeResult
      // This block will handle backpressure
      if (toDrain) {
        await once(destination, 'drain')
      }
    }
  }, {
    async close () {
      destination.end()
      await once(destination, 'close')
    }
  })
}

const FATAL_SEVERITY_NUMBER = 21
/**
 * If the source format has only a single severity that matches the meaning of the range
 * then it is recommended to assign that severity the smallest value of the range.
 * https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/logs/data-model.md#mapping-of-severitynumber
 */
const SEVERITY_NUMBER_MAP = {
  10: 4,
  20: 5,
  30: 9,
  40: 13,
  50: 17,
  60: FATAL_SEVERITY_NUMBER
}

// https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/logs/data-model.md#displaying-severity
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
 * @typedef {Object} SourceObject
 * @property {string} msg
 * @property {number} level
 * @property {number} time
 * @property {string} hostname
 * @property {number} pid
 */

/**
 * @typedef {Object} OpenTelemetryLogData
 * @property {string=} SeverityText
 * @property {string=} SeverityNumber
 * @property {string} Timestamp
 * @property {string} Body
 */

/**
 * Converts a pino log object to an OpenTelemetry log object.
 *
 * @param {SourceObject} sourceObject
 * @returns {OpenTelemetryLogData}
 */
function toOpenTelemetry (obj) {
  const severityNumber = SEVERITY_NUMBER_MAP[obj.level] || FATAL_SEVERITY_NUMBER
  const severityText = SEVERITY_NAME_MAP[severityNumber]

  return {
    Body: obj.msg,
    Timestamp: obj.time,
    SeverityNumber: severityNumber,
    SeverityText: severityText
  }
}
