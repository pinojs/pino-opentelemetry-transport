// https://nodejs.dev/en/learn/#an-example-nodejs-application
const http = require('http')
const pino = require('pino')
const path = require('path')
const transport = pino.transport({
  target: path.join(__dirname, '..', '..', 'pino-opentelemetry-transport')
})

const logger = pino(transport)

const hostname = '127.0.0.1'
const port = 8080

const server = http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  logger.info({ msg: 'test log', foo: 'bar' })
  res.end('Hello World\n')
})

server.listen(port, hostname, () => {
  logger.info(`Server running at http://${hostname}:${port}/`)
})
