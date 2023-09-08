#HTTP Server with trace context propagation

## Running the example

1. Run the [docker compose file](/docker-compose.yaml) in the root of the repo, which will boot the OTLP collector.
`docker compose up`

2. Run the http server by [preloading](https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/#run-the-instrumented-app) the instrumentation code.
```
node -r "./trace-instrumentation.js" http-server.js
```

3. Access the app at [http://localhost:8080](http://localhost:8080)

The request handler function in http-server will create a log entry. Since pino is instrumented with [@opentelemetry/instrumentation-pino](https://www.npmjs.com/package/@opentelemetry/instrumentation-pino) in `trace-instrumentation.js`, it will also add the span context values as attributes [(`trace_id`, `span_id`, `trace_flags`)](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/plugins/node/opentelemetry-instrumentation-pino#fields-added-to-pino-log-objects).

[pino-opentelemetry-transport](https://www.npmjs.com/package/pino-opentelemetry-transport) will read those attributes and add them to the current context. The resulting LogRecord will have those fields populated. Fields `trace_id`, `span_id`, `trace_flags` will not be visible in the LogRecord attributes.


Observe the logs with:

```tail -f /tmp/test-logs/otlp-logs.log```

