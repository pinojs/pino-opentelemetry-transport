# pino-opentelemetry-transport
[![npm version](https://img.shields.io/npm/v/pino-opentelemetry-transport)](https://www.npmjs.com/package/pino-opentelemetry-transport)
[![Build Status](https://img.shields.io/github/workflow/status/Vunovati/pino-opentelemetry-transport/CI)](https://github.com/Vunovati/pino-opentelemetry-transport/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/Vunovati/pino-opentelemetry-transport/badge.svg)](https://snyk.io/test/Vunovati/pino-opentelemetry-transport)
<!-- [![Coverage Status](https://coveralls.io/repos/github/Vunovati/pino-opentelemetry-transport/badge.svg?branch=main)](https://coveralls.io/github/Vunovati/pino-opentelemetry-transport?branch=main) -->
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

Pino transport for OpenTelemetry. Outputs logs in the [OpenTelemetry Log Data Model](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/logs/data-model.md) and sends them to OTLP logs collector.

## Install

```
npm i pino-opentelemetry-transport
```

## Configuration
The transport is using OpenTelemetry JS SDK which can be configured using using env vars as described in [the docs](https://github.com/open-telemetry/opentelemetry-js/blob/d4a41bd815dd50703f692000a70c59235ad71959/experimental/packages/exporter-logs-otlp-grpc/README.md#environment-variable-configuration)

Set the OTLP collector url using `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` or `OTEL_EXPORTER_OTLP_ENDPOINT`

## Usage

```js
const pino = require('pino')

const transport = pino.transport({
  target: 'pino-opentelemetry-transport'
})

const logger = pino(transport)

transport.on('ready', () => {
  setInterval(() => {
    logger.info('test log')
  }, 1000)
})
```

(Also works in CommonJS)

## Test locally

Create the log file to be mounted by OTLP collector container

```touch otlp-logs.log```

Run the OTLP collector in a container

```docker-compose up -d```

Run example.js

```OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4317 node example.js```

Observe the logs

```tail -f otlp-logs.log```

Note that not all log entries will immediately be written to the `otlp-logs.log` file. The collector will flush to disk eventualy. The flush will be forced if the collector receives a kill signal.

## Options

When using the transport the following options can be used:

* `messageKey`: The key of the log message to be used as the OpenTelemetry log entry Body. Optional, value `msg` used by default (like in Pino itself).
## License

MIT
