'use strict'

const { readFile } = require('fs/promises')
const { truncateSync } = require('fs')
const { join } = require('path')
const { test, afterEach, before } = require('tap')
const { promisify } = require('util')
const requireInject = require('require-inject')
const { DockerComposeEnvironment, Wait } = require('testcontainers')

const sleep = promisify(setTimeout)

const logFile = join('/', 'tmp', 'test-logs', 'otlp-logs.log')

before(async () => {
  const composeFilePath = join(__dirname, '..')
  const composeFile = 'docker-compose.yaml'

  const dockerComposeEnv = new DockerComposeEnvironment(
    composeFilePath,
    composeFile
  ).withWaitStrategy(
    'otel-collector-1',
    Wait.forLogMessage('Everything is ready')
  )

  await dockerComposeEnv.up()
})

afterEach(async () => {
  truncateSync(logFile)
})

const MOCK_HOSTNAME = 'hostname'

test('translate Pino log format to Open Telemetry data format for each log level', async ({
  same,
  hasStrict
}) => {
  const pino = requireInject.withEmptyCache('pino', {
    os: {
      hostname: () => MOCK_HOSTNAME
    }
  })

  const transport = pino.transport({
    level: 'trace',
    target: '..',
    options: {
      loggerName: 'test-logger-name',
      resourceAttributes: {
        'service.name': 'test-service',
        'service.version': 'test-service-version'
      },
      serviceVersion: 'test-service-version',
      logRecordProcessorOptions: {
        recordProcessorType: 'simple',
        exporterOptions: {
          protocol: 'grpc'
        }
      }
    }
  })

  const logger = pino(transport, {})
  logger.level = 'trace'

  logger.trace('test trace')
  await sleep(500)
  logger.debug('test debug')
  await sleep(500)
  logger.info('test info')
  await sleep(500)
  logger.warn('test warn')
  await sleep(500)
  logger.error('test error')
  await sleep(500)
  logger.fatal('test fatal')
  await sleep(500)

  const resource = {
    attributes: [
      {
        key: 'service.name',
        value: {
          stringValue: 'test-service'
        }
      },
      {
        key: 'telemetry.sdk.language',
        value: { stringValue: 'nodejs' }
      },
      {
        key: 'telemetry.sdk.name',
        value: { stringValue: 'opentelemetry' }
      }
    ]
  }

  const scope = {
    name: 'test-logger-name',
    version: 'test-service-version'
  }

  const testTraceId = '12345678901234567890123456789012'
  const testSpanId = '1234567890123456'
  const testTraceFlags = '01'

  const extra = {
    foo: 'bar',
    baz: 'qux',
    /* eslint-disable camelcase */
    trace_id: testTraceId,
    span_id: testSpanId,
    trace_flags: testTraceFlags
    /* eslint-enable camelcase */
  }

  logger.trace(extra, 'test trace')

  await sleep(500)

  const content = await readFile(logFile, 'utf8')

  const lines = content
    .split('\n')
    .filter(Boolean)
    .filter(line => line.startsWith('{'))

  const expectedLines = [
    {
      resourceLogs: [
        {
          resource,
          scopeLogs: [
            {
              scope,
              logRecords: [
                {
                  severityNumber: 1,
                  severityText: 'TRACE',
                  body: { stringValue: 'test trace' },
                  traceId: '',
                  spanId: ''
                }
              ]
            }
          ]
        }
      ]
    },
    {
      resourceLogs: [
        {
          resource,
          scopeLogs: [
            {
              scope,
              logRecords: [
                {
                  severityNumber: 5,
                  severityText: 'DEBUG',
                  body: { stringValue: 'test debug' },
                  traceId: '',
                  spanId: ''
                }
              ]
            }
          ]
        }
      ]
    },
    {
      resourceLogs: [
        {
          resource,
          scopeLogs: [
            {
              scope,
              logRecords: [
                {
                  severityNumber: 9,
                  severityText: 'INFO',
                  body: { stringValue: 'test info' },
                  traceId: '',
                  spanId: ''
                }
              ]
            }
          ]
        }
      ]
    },
    {
      resourceLogs: [
        {
          resource,
          scopeLogs: [
            {
              scope,
              logRecords: [
                {
                  severityNumber: 13,
                  severityText: 'WARN',
                  body: { stringValue: 'test warn' },
                  traceId: '',
                  spanId: ''
                }
              ]
            }
          ]
        }
      ]
    },
    {
      resourceLogs: [
        {
          resource,
          scopeLogs: [
            {
              scope,
              logRecords: [
                {
                  severityNumber: 17,
                  severityText: 'ERROR',
                  body: { stringValue: 'test error' },
                  traceId: '',
                  spanId: ''
                }
              ]
            }
          ]
        }
      ]
    },
    {
      resourceLogs: [
        {
          resource,
          scopeLogs: [
            {
              scope,
              logRecords: [
                {
                  severityNumber: 21,
                  severityText: 'FATAL',
                  body: { stringValue: 'test fatal' },
                  traceId: '',
                  spanId: ''
                }
              ]
            }
          ]
        }
      ]
    },
    {
      resourceLogs: [
        {
          resource,
          scopeLogs: [
            {
              scope,
              logRecords: [
                {
                  severityNumber: 1,
                  severityText: 'TRACE',
                  body: { stringValue: 'test trace' },
                  traceId: testTraceId,
                  spanId: testSpanId,
                  attributes: [
                    { key: 'foo', value: { stringValue: 'bar' } },
                    { key: 'baz', value: { stringValue: 'qux' } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]

  same(lines.length, expectedLines.length, 'correct number of lines')

  for (const [lineNumber, logLine] of lines.entries()) {
    hasStrict(
      JSON.parse(logLine),
      expectedLines[lineNumber],
      `line ${lineNumber} severity is mapped correctly`
    )
  }

  hasStrict(
    JSON.parse(lines[lines.length - 1]),
    expectedLines[expectedLines.length - 1],
    'extra bindings are stored'
  )
})
