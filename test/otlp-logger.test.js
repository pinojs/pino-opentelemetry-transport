'use strict'

// test otlp logger with all possible options
const { getOtlpLogger } = require('../otlp-logger')
const { test } = require('tap')
const { InMemoryLogRecordExporter } = require('@opentelemetry/sdk-logs')
const { timeInputToHrTime } = require('@opentelemetry/core')

test('otlp logger logs a record in log exporter and maps all log levels correctly', async ({
  match,
  hasStrict,
  same
}) => {
  const exporter = new InMemoryLogRecordExporter()

  const logger = getOtlpLogger({
    loggerName: 'test-logger',
    resourceAttributes: {
      'service.version': '1.0.0',
      'service.name': 'test-service',
      foo: 'bar'
    },
    serviceVersion: '1.0.0',
    includeTraceContext: true,
    messageKey: 'msg',
    logRecordExporter: exporter,
    useBatchProcessor: false
  })

  const testStart = Date.now()

  const testLogEntryBase = {
    msg: 'test message',
    pid: 123,
    time: testStart,
    hostname: 'test-hostname'
  }

  logger.emit({
    ...testLogEntryBase,
    level: 10
  })
  logger.emit({
    ...testLogEntryBase,
    level: 20
  })
  logger.emit({
    ...testLogEntryBase,
    level: 30
  })
  logger.emit({
    ...testLogEntryBase,
    level: 40
  })
  logger.emit({
    ...testLogEntryBase,
    level: 50
  })
  logger.emit({
    ...testLogEntryBase,
    level: 60
  })
  logger.emit({
    ...testLogEntryBase,
    level: 42
  })

  const records = exporter.getFinishedLogRecords()

  same(records.length, 7)
  match(records[0].hrTime, timeInputToHrTime(testStart))
  match(records[0].severityNumber, 1)
  match(records[0].severityText, 'TRACE')
  match(records[0].body, 'test message')
  match(records[0].resource, {
    _attributes: {
      'service.name': 'test-service',
      'telemetry.sdk.language': 'nodejs',
      'telemetry.sdk.name': 'opentelemetry',
      'service.version': '1.0.0',
      foo: 'bar'
    }
  })
  match(records[0].instrumentationScope, {
    name: 'test-logger',
    version: '1.0.0'
  })

  match(records[1].severityNumber, 5)
  match(records[1].severityText, 'DEBUG')
  match(records[2].severityNumber, 9)
  match(records[2].severityText, 'INFO')
  match(records[3].severityNumber, 13)
  match(records[3].severityText, 'WARN')
  match(records[4].severityNumber, 17)
  match(records[4].severityText, 'ERROR')
  match(records[5].severityNumber, 21)
  match(records[5].severityText, 'FATAL')
  // In case of unexpected severity number, the severity number is set to the highest value.
  match(records[6].severityNumber, 0)
  match(records[6].severityText, 'UNSPECIFIED')

  logger.shutdown()

  hasStrict(exporter.getFinishedLogRecords(), [])
})
