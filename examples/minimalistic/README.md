### Minimalistic example

## Running the example

1. Run the [docker compose file](/docker-compose.yaml) in the root of the repo, which will boot the OTLP collector:
`docker compose up`

2. Run the service setting the `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`, `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`, and `OTEL_RESOURCE_ATTRIBUTES` env vars

```
OTEL_EXPORTER_OTLP_LOGS_PROTOCOL='grpc' OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4317 OTEL_RESOURCE_ATTRIBUTES="service.name=my-service,service.version=1.2.3" node minimalistic.js
```

