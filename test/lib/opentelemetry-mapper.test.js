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

  t.assert.partialDeepStrictEqual(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: pinoLogLevels.debug
      },
      mapperOptions
    ),
    {
      severityNumber: SeverityNumber.DEBUG,
      severityText: 'debug'
    }
  )

  t.assert.partialDeepStrictEqual(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: pinoLogLevels.info
      },
      mapperOptions
    ),
    {
      severityNumber: SeverityNumber.INFO,
      severityText: 'info'
    }
  )

  t.assert.partialDeepStrictEqual(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: pinoLogLevels.warn
      },
      mapperOptions
    ),
    {
      severityNumber: SeverityNumber.WARN,
      severityText: 'warn'
    }
  )

  t.assert.partialDeepStrictEqual(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: pinoLogLevels.error
      },
      mapperOptions
    ),
    {
      severityNumber: SeverityNumber.ERROR,
      severityText: 'error'
    }
  )

  t.assert.partialDeepStrictEqual(
    toOpenTelemetry(
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
    ),
    {
      severityNumber: SeverityNumber.FATAL,
      severityText: 'fatal'
    },
    'use default severity numbers when level does not exist in severityNumberMap'
  )

  t.assert.partialDeepStrictEqual(
    toOpenTelemetry(
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
    ),
    {
      severityNumber: SeverityNumber.INFO3,
      severityText: 'info'
    },
    'use configured severity numbers for built-in levels'
  )

  t.assert.partialDeepStrictEqual(
    toOpenTelemetry(
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
    ),
    {
      severityNumber: SeverityNumber.INFO2,
      severityText: 'custom'
    },
    'use configured severity numbers for custom levels'
  )

  t.assert.partialDeepStrictEqual(
    toOpenTelemetry(
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
    ),
    {
      severityNumber: SeverityNumber.UNSPECIFIED,
      severityText: 'custom'
    },
    'use UNSPECIFIED severity number when there is no match for the level'
  )
})
