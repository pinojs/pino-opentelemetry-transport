'use strict'

// test otlp logger with all possible options
const { toOpenTelemetry, DEFAULT_SEVERITY_NUMBER_MAP } = require('../../lib/opentelemetry-mapper')
const { test } = require('tap')
const { SeverityNumber } = require('@opentelemetry/api-logs')
const pino = require('pino')

test('default severity number map', async ({ match }) => {
  const pinoLogLevels = pino.levels.values
  match(DEFAULT_SEVERITY_NUMBER_MAP, {
    [pinoLogLevels.trace]: SeverityNumber.TRACE,
    [pinoLogLevels.debug]: SeverityNumber.DEBUG,
    [pinoLogLevels.info]: SeverityNumber.INFO,
    [pinoLogLevels.warn]: SeverityNumber.WARN,
    [pinoLogLevels.error]: SeverityNumber.ERROR,
    [pinoLogLevels.fatal]: SeverityNumber.FATAL
  })
})

test('toOpenTelemetry maps all log levels correctly', async ({ match }) => {
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

  match(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: 10,
        trace_id: testTraceId,
        span_id: testSpanId,
        trace_flags: testTraceFlags,
        testAttribute: 'test'
      },
      { messageKey: 'msg' }
    ),
    {
      severityNumber: 1,
      severityText: 'TRACE',
      body: 'test message',
      attributes: {
        testAttribute: 'test',
        span_id: testSpanId,
        trace_id: testTraceId,
        trace_flags: testTraceFlags
      }
    }
  )

  match(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: 20
      },
      { messageKey: 'msg' }
    ),
    {
      severityNumber: 5,
      severityText: 'DEBUG'
    }
  )

  match(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: 30
      },
      { messageKey: 'msg' }
    ),
    {
      severityNumber: 9,
      severityText: 'INFO'
    }
  )

  match(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: 40
      },
      { messageKey: 'msg' }
    ),
    {
      severityNumber: 13,
      severityText: 'WARN'
    }
  )

  match(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: 50
      },
      { messageKey: 'msg' }
    ),
    {
      severityNumber: 17,
      severityText: 'ERROR'
    }
  )

  match(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: 60
      },
      {
        messageKey: 'msg',
        severityNumberMap: {
          35: 10
        }
      }
    ),
    {
      severityNumber: 21,
      severityText: 'FATAL'
    }
  )

  match(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: 35
      },
      {
        messageKey: 'msg',
        severityNumberMap: {
          35: 10
        }
      }
    ),
    {
      severityNumber: 10,
      severityText: 'INFO2'
    }
  )

  match(
    toOpenTelemetry(
      {
        ...testLogEntryBase,
        level: 42
      },
      {
        messageKey: 'msg',
        severityNumberMap: {
          35: 10
        }
      }
    ),
    {
      severityNumber: 0,
      severityText: 'UNSPECIFIED'
    }
  )
})
