'use strict'

const { readFile } = require('fs/promises')
const { truncateSync } = require('fs')
const { join } = require('path')
const { test, afterEach, beforeEach } = require('tap')
const { promisify } = require('util')
const requireInject = require('require-inject')
const { GenericContainer, Wait } = require('testcontainers')

const sleep = promisify(setTimeout)

const logFile = join('/', 'tmp', 'test-logs', 'otlp-logs.log')
let otlpCollectorContainer

beforeEach(async () => {
  const container = new GenericContainer(
    'otel/opentelemetry-collector-contrib:latest'
  )

  otlpCollectorContainer = await container
    .withExposedPorts(4317)
    .withBindMounts([
      {
        source: join(__dirname, '..', 'otel-collector-config.yaml'),
        target: '/etc/otel-collector-config.yaml'
      },
      {
        source: '/tmp/test-logs',
        target: '/etc/test-logs',
        mode: 'rw'
      }
    ])
    .withCommand('--config=/etc/otel-collector-config.yaml')
    .withWaitStrategy(Wait.forLogMessage('Everything is ready'))
    .start()

  sleep(2000)
})

afterEach(async () => {
  //truncateSync(logFile)
  await otlpCollectorContainer?.stop()
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
      useBatchProcessor: false // make sure all logs are flushed immediately
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

  const extra = {
    foo: 'bar',
    baz: 'qux'
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
                  traceId: '',
                  spanId: '',
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
