'use strict'

const assert = require('node:assert/strict')
const { execFile, execFileSync } = require('node:child_process')
const { once } = require('node:events')
const { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { createServer } = require('node:http')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
const { promisify } = require('node:util')

const root = resolve(__dirname, '..')
const npm = process.env.npm_execpath
assert.ok(npm, 'Run the package smoke test with npm run test:package')

function runNpm (args, cwd) {
  return execFileSync(process.execPath, [npm, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 120000,
    stdio: ['ignore', 'pipe', 'inherit']
  })
}

function verifyRequests (requests) {
  const traceId = '12345678901234567890123456789012'
  const spanId = '1234567890123456'
  assert.ok(requests.length > 0, 'Worker shutdown must export buffered records')
  const records = []
  for (const request of requests) {
    assert.equal(request.path, '/v1/logs')
    for (const resource of request.body.resourceLogs) {
      assert.ok(resource.resource.attributes.some(attribute => attribute.key === 'service.name' && attribute.value.stringValue === 'packed-consumer-service'))
      for (const scope of resource.scopeLogs) {
        assert.equal(scope.scope.name, 'packed-consumer')
        assert.equal(scope.scope.version, '1.2.3')
        records.push(...scope.logRecords)
      }
    }
  }
  assert.equal(records.length, 2)
  assert.equal(records[0].body.stringValue, 'correlated record')
  assert.equal(records[0].severityNumber, 9)
  assert.equal(records[0].traceId, traceId)
  assert.equal(records[0].spanId, spanId)
  assert.equal(records[0].flags & 1, 1)
  assert.ok(records[0].attributes.some(attribute => attribute.key === 'extra' && attribute.value.stringValue === 'retained'))
  assert.ok(records[0].attributes.every(attribute => !['trace_id', 'span_id', 'trace_flags'].includes(attribute.key)))
  assert.equal(records[1].body.stringValue, 'last buffered record')
  assert.equal(records[1].severityNumber, 17)
}

async function main () {
  const consumer = mkdtempSync(join(tmpdir(), 'pino-otel-consumer-'))
  const requests = []
  // Keep the receiver outside the consumer: transport.end() can block its main thread.
  const server = createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    requests.push({ path: request.url, body: JSON.parse(Buffer.concat(chunks)) })
    response.setHeader('content-type', 'application/json')
    response.end('{}')
  })
  try {
    const [{ filename }] = JSON.parse(runNpm(['pack', '--json', '--pack-destination', consumer], root))
    const installedVersion = name => JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({
      private: true,
      dependencies: {
        'pino-opentelemetry-transport': `file:${join(consumer, filename)}`,
        pino: installedVersion('pino'),
        '@opentelemetry/api': installedVersion('@opentelemetry/api')
      }
    }))
    runNpm(['install', '--ignore-scripts', '--strict-peer-deps', '--no-audit', '--no-fund'], consumer)
    // An install can warn about nested peer conflicts; inspect the installed graph too.
    runNpm(['ls', '--all', '--omit=dev'], consumer)
    copyFileSync(join(__dirname, 'fixtures', 'package-consumer.js'), join(consumer, 'consumer.js'))
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    await promisify(execFile)(process.execPath, ['consumer.js', `http://127.0.0.1:${server.address().port}/v1/logs`], {
      cwd: consumer,
      timeout: 30000,
      env: { ...process.env, NODE_PATH: '', OTEL_NODE_RESOURCE_DETECTORS: 'none' }
    })
    verifyRequests(requests)
    console.log('Packed consumer dependency graph, worker export and shutdown passed')
  } finally {
    await new Promise(resolve => server.close(resolve))
    rmSync(consumer, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
