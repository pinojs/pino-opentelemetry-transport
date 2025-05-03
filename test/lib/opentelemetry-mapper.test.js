'use strict'

// test otlp logger with all possible options
const { toOpenTelemetry, DEFAULT_SEVERITY_NUMBER_MAP } = require('../../lib/opentelemetry-mapper')
const { test } = require('node:test')
const { SeverityNumber } = require('@opentelemetry/api-logs')
const pino = require('pino')

const pinoLogLevels = pino.levels.values

test('default severity number map', async (t) => {
  t.assert.deepStrictEqual(DEFAULT_SEVERITY_NUMBER_MAP, {
    [pinoLogLevels.trace]: SeverityNumber.TRACE,
    [pinoLogLevels.debug]: SeverityNumber.DEBUG,
    [pinoLogLevels.info]: SeverityNumber.INFO,
    [pinoLogLevels.warn]: SeverityNumber.WARN,
    [pinoLogLevels.error]: SeverityNumber.ERROR,
    [pinoLogLevels.fatal]: SeverityNumber.FATAL
  })
})

test('toOpenTelemetry maps all log levels correctly', async (t) => {
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

  t.assert.deepStrictEqual(
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
  t.assert.deepStrictEqual(debugResult.severityNumber, SeverityNumber.DEBUG)
  t.assert.deepStrictEqual(debugResult.severityText, 'debug')

  const infoResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.info
    },
    mapperOptions
  )
  t.assert.deepStrictEqual(infoResult.severityNumber, SeverityNumber.INFO)
  t.assert.deepStrictEqual(infoResult.severityText, 'info')

  const warnResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.warn
    },
    mapperOptions
  )
  t.assert.deepStrictEqual(warnResult.severityNumber, SeverityNumber.WARN)
  t.assert.deepStrictEqual(warnResult.severityText, 'warn')

  const errorResult = toOpenTelemetry(
    {
      ...testLogEntryBase,
      level: pinoLogLevels.error
    },
    mapperOptions
  )
  t.assert.deepStrictEqual(errorResult.severityNumber, SeverityNumber.ERROR)
  t.assert.deepStrictEqual(errorResult.severityText, 'error')

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
  t.assert.deepStrictEqual(fatalResult.severityNumber, SeverityNumber.FATAL)
  t.assert.deepStrictEqual(fatalResult.severityText, 'fatal')

  const infoWithSeverity = toOpenTelemetry(
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
  t.assert.deepStrictEqual(infoWithSeverity.severityNumber, SeverityNumber.INFO3)
  t.assert.deepStrictEqual(infoWithSeverity.severityText, 'info')

  const customWithSeverity = toOpenTelemetry(
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
  t.assert.deepStrictEqual(customWithSeverity.severityNumber, SeverityNumber.INFO2)
  t.assert.deepStrictEqual(customWithSeverity.severityText, 'custom')

  const customLevel = toOpenTelemetry(
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
  t.assert.deepStrictEqual(customLevel.severityNumber, SeverityNumber.UNSPECIFIED)
  t.assert.deepStrictEqual(customLevel.severityText, 'custom')
})
