'use strict'

const { mkdir, rm, readFile } = require('fs/promises')
const { join } = require('path')
const { test, beforeEach } = require('tap')
const { promisify } = require('util')
const { tmpdir } = require('os')
const pino = require('pino')

async function cleanAndCreateFolder (path) {
  await rm(path, { force: true, recursive: true })
  await mkdir(path, { force: true, recursive: true })
}

const sleep = promisify(setTimeout)

const logFolder = join(tmpdir(), 'test-logs')

beforeEach(() => cleanAndCreateFolder(logFolder))

test('translates pino log format to Open Telemetry data format', async ({ match, afterEach }) => {
  const ms = 1531069919686
  const now = Date.now
  Date.now = () => ms

  afterEach(() => {
    Date.now = now

    return rm(logFolder, { force: true, recursive: true })
  })

  const logFile = join(logFolder, 'pino.log')

  const transport = pino.transport({
    level: 'trace',
    target: '..',
    options: { destination: logFile }
  })

  const logger = pino(transport)
  logger.level = 'trace'
  logger.trace('test trace')
  logger.debug('test debug')
  logger.info('test info')
  logger.warn('test warn')
  logger.error('test error')
  logger.fatal('test fatal')

  await sleep(1000)
  const content = await readFile(logFile, 'utf8')

  const expectedLines = [
    { Body: 'test trace', Timestamp: ms, SeverityNumber: 4, SeverityText: 'TRACE4' },
    { Body: 'test debug', Timestamp: ms, SeverityNumber: 5, SeverityText: 'DEBUG' },
    { Body: 'test info', Timestamp: ms, SeverityNumber: 9, SeverityText: 'INFO' },
    { Body: 'test warn', Timestamp: ms, SeverityNumber: 13, SeverityText: 'WARN' },
    { Body: 'test error', Timestamp: ms, SeverityNumber: 17, SeverityText: 'ERROR' },
    { Body: 'test fatal', Timestamp: ms, SeverityNumber: 21, SeverityText: 'FATAL' }
  ]

  const logEntries = content.split('\n').filter(Boolean).map(JSON.parse)

  match(expectedLines[0], logEntries[0])
  match(expectedLines[1], logEntries[1])
  match(expectedLines[2], logEntries[2])
  match(expectedLines[3], logEntries[3])
  match(expectedLines[4], logEntries[4])
  match(expectedLines[5], logEntries[5])
})
