'use strict'

// Ported verbatim from otlp-logger test/lib/create-log-processor.test.js
// (https://github.com/Vunovati/otlp-logger), harness translated from tap to
// node:test. Targets the inlined shim's createLogProcessor instead of the
// otlp-logger package.

const { test } = require('node:test')
const assert = require('node:assert')

const { createLogProcessor } = require('../../lib/otlp-logger-shim')
const {
  BatchLogRecordProcessor,
  SimpleLogRecordProcessor,
  ConsoleLogRecordExporter
} = require('@opentelemetry/sdk-logs')
const {
  OTLPLogExporter: GrpcExporter
} = require('@opentelemetry/exporter-logs-otlp-grpc')
const {
  OTLPLogExporter: ProtoExporter
} = require('@opentelemetry/exporter-logs-otlp-proto')
const {
  OTLPLogExporter: HttpExporter
} = require('@opentelemetry/exporter-logs-otlp-http')

test('createLogProcessor - no params', async () => {
  const logProcessor = createLogProcessor()

  assert.ok(logProcessor instanceof BatchLogRecordProcessor)
})

test('createLogProcessor - empty opts', async () => {
  const logProcessor = createLogProcessor({})

  assert.ok(logProcessor instanceof BatchLogRecordProcessor)
})

test('createLogProcessor - simple', async () => {
  const logProcessor = createLogProcessor({
    recordProcessorType: 'simple'
  })

  assert.ok(logProcessor instanceof SimpleLogRecordProcessor)
  assert.ok(logProcessor._exporter instanceof ProtoExporter)
})

test('createLogProcessor - simple with console exporter', async () => {
  const logProcessor = createLogProcessor({
    recordProcessorType: 'simple',
    exporterOptions: {
      protocol: 'console'
    }
  })

  assert.ok(logProcessor instanceof SimpleLogRecordProcessor)
  assert.ok(logProcessor._exporter instanceof ConsoleLogRecordExporter)
})

test('createLogProcessor - simple with grpc exporter', async () => {
  const logProcessor = createLogProcessor({
    recordProcessorType: 'simple',
    exporterOptions: {
      protocol: 'grpc'
    }
  })

  assert.ok(logProcessor instanceof SimpleLogRecordProcessor)
  assert.ok(logProcessor._exporter instanceof GrpcExporter)
})

test('createLogProcessor - simple with grpc exporter set as env var', async (t) => {
  process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL = 'grpc'

  t.after(() => {
    delete process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL
  })

  const logProcessor = createLogProcessor({
    recordProcessorType: 'simple'
  })

  assert.ok(logProcessor instanceof SimpleLogRecordProcessor)
  assert.ok(logProcessor._exporter instanceof GrpcExporter)
})

test('createLogProcessor - simple with http exporter set as env var', async (t) => {
  process.env.OTEL_EXPORTER_OTLP_PROTOCOL = 'http'

  t.after(() => {
    delete process.env.OTEL_EXPORTER_OTLP_PROTOCOL
  })

  const logProcessor = createLogProcessor({
    recordProcessorType: 'simple'
  })

  assert.ok(logProcessor instanceof SimpleLogRecordProcessor)
  assert.ok(logProcessor._exporter instanceof HttpExporter)
})

test('createLogProcessor - simple with http exporter', async () => {
  const logProcessor = createLogProcessor({
    recordProcessorType: 'simple',
    exporterOptions: {
      protocol: 'http'
    }
  })

  assert.ok(logProcessor instanceof SimpleLogRecordProcessor)
  assert.ok(logProcessor._exporter instanceof HttpExporter)
})

// Not in upstream's unit suite (upstream covered the protobuf default + its
// exporterOptions via its integration test). Added here in the same per-protocol
// style because this repo's integration test uses grpc, leaving the proto-default
// branch with truthy exporterOptions otherwise uncovered.
test('createLogProcessor - simple with protobuf exporter', async () => {
  const logProcessor = createLogProcessor({
    recordProcessorType: 'simple',
    exporterOptions: {
      protocol: 'http/protobuf',
      protobufExporterOptions: {}
    }
  })

  assert.ok(logProcessor instanceof SimpleLogRecordProcessor)
  assert.ok(logProcessor._exporter instanceof ProtoExporter)
})

test('createLogProcessor - batch with console exporter', async () => {
  const logProcessor = createLogProcessor({
    recordProcessorType: 'batch',
    exporterOptions: {
      protocol: 'console'
    },
    processorConfig: {
      maxQueueSize: 42
    }
  })

  assert.ok(logProcessor instanceof BatchLogRecordProcessor)
  assert.ok(logProcessor._exporter instanceof ConsoleLogRecordExporter)
})
