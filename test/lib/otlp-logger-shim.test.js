'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const {
  getOtlpLogger,
  createExporter,
  createLogProcessor,
  loadContext
} = require('../../lib/otlp-logger-shim')

test('getOtlpLogger returns object with emit and shutdown methods', async () => {
  const logger = getOtlpLogger({
    loggerName: 'test-logger',
    serviceVersion: '1.0.0',
    logRecordProcessorOptions: {
      recordProcessorType: 'simple',
      exporterOptions: { protocol: 'console' }
    }
  })

  assert.ok(typeof logger.emit === 'function')
  assert.ok(typeof logger.shutdown === 'function')
})

test('getOtlpLogger accepts a single logRecordProcessorOptions', async () => {
  const logger = getOtlpLogger({
    loggerName: 'test-logger',
    serviceVersion: '1.0.0',
    logRecordProcessorOptions: {
      recordProcessorType: 'simple',
      exporterOptions: { protocol: 'console' }
    }
  })

  assert.ok(typeof logger.emit === 'function')
  await logger.shutdown()
})

test('getOtlpLogger accepts an array of logRecordProcessorOptions', async () => {
  const logger = getOtlpLogger({
    loggerName: 'test-logger',
    serviceVersion: '1.0.0',
    logRecordProcessorOptions: [
      {
        recordProcessorType: 'simple',
        exporterOptions: { protocol: 'console' }
      }
    ]
  })

  assert.ok(typeof logger.emit === 'function')
  await logger.shutdown()
})

test('getOtlpLogger merges resource attributes', async () => {
  const logger = getOtlpLogger({
    loggerName: 'test-service',
    serviceVersion: '1.0.0',
    resourceAttributes: {
      'service.name': 'my-service',
      'service.version': '1.2.3'
    },
    logRecordProcessorOptions: {
      recordProcessorType: 'simple',
      exporterOptions: { protocol: 'console' }
    }
  })

  assert.ok(typeof logger.emit === 'function')
  await logger.shutdown()
})

test('createExporter returns ConsoleLogRecordExporter for console protocol', () => {
  const exporter = createExporter({ protocol: 'console' })
  assert.ok(exporter)
  // ConsoleLogRecordExporter should have an export method
  assert.ok(typeof exporter.export === 'function')
})

test('createLogProcessor creates SimpleLogRecordProcessor when recordProcessorType is simple', () => {
  const processor = createLogProcessor({
    recordProcessorType: 'simple',
    exporterOptions: { protocol: 'console' }
  })

  assert.ok(processor)
  assert.ok(typeof processor.onEmit === 'function')
})

test('createLogProcessor creates BatchLogRecordProcessor by default', () => {
  const processor = createLogProcessor({
    exporterOptions: { protocol: 'console' }
  })

  assert.ok(processor)
  assert.ok(typeof processor.onEmit === 'function')
})

test('loadContext strips trace_id, span_id, trace_flags from attributes', () => {
  const logRecord = {
    body: 'test message',
    severityNumber: 9,
    attributes: {
      trace_id: '12345678901234567890123456789012',
      span_id: '1234567890123456',
      trace_flags: '01',
      foo: 'bar'
    }
  }

  const result = loadContext(logRecord)

  // trace fields should be removed from attributes
  assert.ok(!result.attributes.trace_id)
  assert.ok(!result.attributes.span_id)
  assert.ok(!result.attributes.trace_flags)
  assert.strictEqual(result.attributes.foo, 'bar')

  // context should be set
  assert.ok(result.context)
})

test('loadContext passes through attributes without trace fields unchanged', () => {
  const logRecord = {
    body: 'test message',
    severityNumber: 9,
    attributes: {
      foo: 'bar',
      baz: 'qux'
    }
  }

  const result = loadContext(logRecord)

  assert.strictEqual(result.attributes.foo, 'bar')
  assert.strictEqual(result.attributes.baz, 'qux')
})

test('loadContext handles undefined attributes', () => {
  const logRecord = {
    body: 'test message',
    severityNumber: 9
  }

  const result = loadContext(logRecord)

  assert.deepStrictEqual(result.attributes, undefined)
})
