# Using Multiple Record Processors

Logs can be exported with multiple record processors, each using different exporter. Instead of providing `logRecordProcessorOptions` as a single object, an array of `logRecordProcessorOptions` must be provided instead.

Supported processors: `batch`, `simple`

Supported exporters: `console`, `grpc`, `http`, `http/protobuf`

## Running the example

1. Run the [docker compose file](/docker-compose.yaml) in the root of the repo, which will boot the OTLP collector:
`docker compose up`

2. Run the service

```
node multiple-processors.js
```
