'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const { toOpenTelemetry, DEFAULT_SEVERITY_NUMBER_MAP } = require('../../lib/opentelemetry-mapper')
const { SeverityNumber } = require('@opentelemetry/api-logs')
const pino = require('pino')

const pinoLogLevels = pino.levels.values

test('default severity number map', async () => {
  assert.deepStrictEqual(DEFAULT_SEVERITY_NUMBER_MAP, {
    [pinoLogLevels.trace]: SeverityNumber.TRACE,
    [pinoLogLevels.debug]: SeverityNumber.DEBUG,
    [pinoLogLevels.info]: SeverityNumber.INFO,
    [pinoLogLevels.warn]: SeverityNumber.WARN,
    [pinoLogLevels.error]: SeverityNumber.ERROR,
    [pinoLogLevels.fatal]: SeverityNumber.FATAL
  })
})

test('toOpenTelemetry maps all log levels correctly', async () => {
  const mapperOptions = { messageKey: 'msg', levels: pino.levels }
  const testStart = Date.now()
  const testLogEntryBase = {
    msg: 'test message',
    pid: 123,
    time: testStart,
    hostname: 'test-hostname'
  }

  const testTraceId = '12345678901234567890123456789012'
  const testSpanId = '1234567890123456'
  const testTraceFlags = '01'

  assert.deepStrictEqual(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: pinoLogLevels.trace,
        trace_id: testTraceId,
        span_id: testSpanId,
        trace_flags: testTraceFlags,
        testAttribute: 'test'
      },
      mapperOptions
    ),
    {
      severityNumber: SeverityNumber.TRACE,
      severityText: 'trace',
      timestamp: testStart,
      body: 'test message',
      attributes: {
        testAttribute: 'test',
        span_id: testSpanId,
        trace_id: testTraceId,
        trace_flags: testTraceFlags
      }
    }
  )

  const debugResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.debug
    },
    mapperOptions
  )
  assert.strictEqual(debugResult.severityNumber, SeverityNumber.DEBUG)
  assert.strictEqual(debugResult.severityText, 'debug')

  const infoResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.info
    },
    mapperOptions
  )
  assert.strictEqual(infoResult.severityNumber, SeverityNumber.INFO)
  assert.strictEqual(infoResult.severityText, 'info')

  const warnResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.warn
    },
    mapperOptions
  )
  assert.strictEqual(warnResult.severityNumber, SeverityNumber.WARN)
  assert.strictEqual(warnResult.severityText, 'warn')

  const errorResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.error
    },
    mapperOptions
  )
  assert.strictEqual(errorResult.severityNumber, SeverityNumber.ERROR)
  assert.strictEqual(errorResult.severityText, 'error')

  const fatalResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.fatal
    },
    {
      ...mapperOptions,
      severityNumberMap: {
        35: SeverityNumber.INFO2
      }
    }
  )
  assert.strictEqual(fatalResult.severityNumber, SeverityNumber.FATAL, 'use default severity numbers when level does not exist in severityNumberMap')
  assert.strictEqual(fatalResult.severityText, 'fatal')

  const customInfoResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.info
    },
    {
      ...mapperOptions,
      severityNumberMap: {
        [pinoLogLevels.info]: SeverityNumber.INFO3
      }
    }
  )
  assert.strictEqual(customInfoResult.severityNumber, SeverityNumber.INFO3, 'use configured severity numbers for built-in levels')
  assert.strictEqual(customInfoResult.severityText, 'info')

  const customLevelResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: 35
    },
    {
      ...mapperOptions,
      levels: {
        labels: {
          35: 'custom'
        }
      },
      severityNumberMap: {
        35: SeverityNumber.INFO2
      }
    }
  )
  assert.strictEqual(customLevelResult.severityNumber, SeverityNumber.INFO2, 'use configured severity numbers for custom levels')
  assert.strictEqual(customLevelResult.severityText, 'custom')

  const unmappedCustomLevelResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: 35
    },
    {
      ...mapperOptions,
      levels: {
        labels: {
          35: 'custom'
        }
      }
    }
  )
  assert.strictEqual(unmappedCustomLevelResult.severityNumber, SeverityNumber.UNSPECIFIED, 'use UNSPECIFIED severity number when there is no match for the level')
  assert.strictEqual(unmappedCustomLevelResult.severityText, 'custom')
})
