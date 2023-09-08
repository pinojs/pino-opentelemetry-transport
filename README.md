# pino-opentelemetry-transport
[![npm version](https://img.shields.io/npm/v/pino-opentelemetry-transport)](https://www.npmjs.com/package/pino-opentelemetry-transport)
[![Build Status](https://img.shields.io/github/workflow/status/Vunovati/pino-opentelemetry-transport/CI)](https://github.com/Vunovati/pino-opentelemetry-transport/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/Vunovati/pino-opentelemetry-transport/badge.svg)](https://snyk.io/test/Vunovati/pino-opentelemetry-transport)
<!-- [![Coverage Status](https://coveralls.io/repos/github/Vunovati/pino-opentelemetry-transport/badge.svg?branch=main)](https://coveralls.io/github/Vunovati/pino-opentelemetry-transport?branch=main) -->
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

Pino transport for OpenTelemetry. Outputs logs in the [OpenTelemetry Log Data Model](https://github.com/open-telemetry/opentelemetry-specification/blob/fc8289b8879f3a37e1eba5b4e445c94e74b20359/specification/logs/data-model.md) and sends them to an OTLP logs collector.

## Install

```
npm i pino-opentelemetry-transport
```

## Configuration
The transport is using OpenTelemetry JS SDK, which can be configured using environment variables as described in [the docs](https://github.com/open-telemetry/opentelemetry-js/blob/d4a41bd815dd50703f692000a70c59235ad71959/experimental/packages/exporter-logs-otlp-grpc/README.md#environment-variable-configuration)

The OTLP collector URL can be set by setting either of the following environment variables:
`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`,
`OTEL_EXPORTER_OTLP_ENDPOINT`

## Usage

### Minimalistic example

Make sure you have access to an OTEL collector.

To start quickly, create a minimal configuration for OTEL collector in the `otel-collector-config.yaml` file:

```
receivers:
  otlp:
    protocols:
      grpc:

exporters:
  file:
    path: ./etc/test-logs/otlp-logs.log
    flush_interval: 1

  logging:
    verbosity: basic
  
processors:
  batch:

service:
  pipelines:
    logs:
      receivers: [otlp]
      processors: []
      exporters: [logging, file]
```

The collector can then be ran with:

```
docker run --volume=$(pwd)/otel-collector-config.yaml:/etc/otel-collector-config.yaml:rw --volume=/tmp/test-logs:/etc/test-logs:rw -p 4317:4317 -d otel/opentelemetry-collector-contrib:latest --config=/etc/otel-collector-config.yaml
```

Create an index.js file containing

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

Install Pino and pino-opentelemetry-transport

```
npm install pino pino-opentelemetry-transport
```


Run the service setting the `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` and `OTEL_RESOURCE_ATTRIBUTES` env vars

```
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4317 OTEL_RESOURCE_ATTRIBUTES="service.name=my-service,service.version=1.2.3" node index.js
```

## Test the repo locally

Run the OTLP collector in a container

```npm run docker-run```

Run example.js

```OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4317 node example.js```

Observe the logs

```tail -f /tmp/test-logs/otlp-logs.log```

Note that not all log entries will immediately be written to the `otlp-logs.log` file. The collector will flush to the disk eventually. The flush will be forced if the collector receives a kill signal.

## Examples
[HTTP Server with trace context propagation](./examples/trace-context)

## Options

When using the transport, the following options can be used:

* `messageKey`: The key of the log message to be used as the OpenTelemetry log entry Body. Optional, value `msg` used by default (like in Pino itself).
* `resourceAttributes`: Object containing [resource attributes](https://opentelemetry.io/docs/instrumentation/js/resources/).

## License

MIT
