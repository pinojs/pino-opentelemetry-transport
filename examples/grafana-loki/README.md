# Sending logs to Grafana Loki

## Running the example

### Local infrastructure

Run the required infra locally with
`docker compose up`

It will boot [Grafana](https://grafana.com/docs/grafana/latest/), [Loki](https://grafana.com/docs/loki/latest/) and an [Opentelemetry Collector](https://opentelemetry.io/docs/collector/).

Loki ingester readiness can be checked at
[http://localhost:3100/ready](http://localhost:3100/ready).

The logs can be inspected in Grafana UI at
[http://localhost:3000/explore](http://localhost:3000/explore).

[This article](https://grafana.com/docs/opentelemetry/visualization/loki-data/) explains how to inspect OTLP data in the Grafana UI.

### Generating logs
Run the [trace-context](../trace-context) example, but skip the `docker compose up` part

