'use strict'

// Ported verbatim from otlp-logger test/lib/otlp-logger.test.js
// (https://github.com/Vunovati/otlp-logger), harness translated from tap to
// node:test. Targets the inlined shim instead of the otlp-logger package.

const { test } = require('node:test')
const assert = require('node:assert')
const requireInject = require('require-inject')
const {
  resourceFromAttributes,
  detectResources: realDetectResources,
  envDetector,
  hostDetector,
  osDetector,
  processDetector,
  serviceInstanceIdDetector
} = require('@opentelemetry/resources')

const baseOpts = {
  loggerName: 'test-logger',
  serviceVersion: '1.0.0',
  resourceAttributes: { 'service.name': 'test-service' },
  logRecordProcessorOptions: {
    recordProcessorType: 'simple',
    exporterOptions: { protocol: 'console' }
  }
}

function loadOtlpLoggerWithMock (captureCallback) {
  return requireInject('../../lib/otlp-logger-shim', {
    '@opentelemetry/resources': {
      resourceFromAttributes,
      envDetector,
      hostDetector,
      osDetector,
      processDetector,
      serviceInstanceIdDetector,
      detectResources: (opts) => {
        captureCallback(opts.detectors)
        return realDetectResources(opts)
      }
    }
  })
}

test('getOtlpLogger - default detectors when OTEL_NODE_RESOURCE_DETECTORS is not set', async (t) => {
  delete process.env.OTEL_NODE_RESOURCE_DETECTORS

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 5)
  assert.strictEqual(capturedDetectors[0], envDetector)
  assert.strictEqual(capturedDetectors[1], hostDetector)
  assert.strictEqual(capturedDetectors[2], osDetector)
  assert.strictEqual(capturedDetectors[3], processDetector)
  assert.strictEqual(capturedDetectors[4], serviceInstanceIdDetector)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=host,os detects only host and os', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'host,os'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 2)
  assert.strictEqual(capturedDetectors[0], hostDetector)
  assert.strictEqual(capturedDetectors[1], osDetector)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS="host, os" trims whitespace', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'host, os'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 2)
  assert.strictEqual(capturedDetectors[0], hostDetector)
  assert.strictEqual(capturedDetectors[1], osDetector)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=host,aws,gcp ignores unknown detectors', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'host,aws,gcp'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 1)
  assert.strictEqual(capturedDetectors[0], hostDetector)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=aws,gcp results in empty detectors', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'aws,gcp'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 0)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=all activates all detectors', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'all'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 5)
  assert.strictEqual(capturedDetectors[0], envDetector)
  assert.strictEqual(capturedDetectors[1], hostDetector)
  assert.strictEqual(capturedDetectors[2], osDetector)
  assert.strictEqual(capturedDetectors[3], processDetector)
  assert.strictEqual(capturedDetectors[4], serviceInstanceIdDetector)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=process detects only process', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'process'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 1)
  assert.strictEqual(capturedDetectors[0], processDetector)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=serviceinstance detects serviceinstance', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'serviceinstance'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 1)
  assert.strictEqual(capturedDetectors[0], serviceInstanceIdDetector)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=none skips detection', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'none'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 0)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS="" falls back to defaults', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = ''

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 5)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=none,host none overrides all other entries', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'none,host'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 0)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=all,none none wins over all', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = 'all,none'

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 0)

  await logger.shutdown()
})

test('getOtlpLogger - OTEL_NODE_RESOURCE_DETECTORS=" " whitespace-only falls back to defaults', async (t) => {
  process.env.OTEL_NODE_RESOURCE_DETECTORS = '  '

  t.after(() => {
    delete process.env.OTEL_NODE_RESOURCE_DETECTORS
  })

  let capturedDetectors
  const { getOtlpLogger } = loadOtlpLoggerWithMock((detectors) => {
    capturedDetectors = detectors
  })

  const logger = getOtlpLogger(baseOpts)

  assert.strictEqual(capturedDetectors.length, 5)

  await logger.shutdown()
})
