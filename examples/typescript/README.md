# TypeScript

## Running the example

1. Generate types
```
npm run generate-types
```

2. Run the [docker compose file](/docker-compose.yaml) in the root of the repo, which will boot the OTLP collector:
`docker compose up`

3. Run the service

```
npx ts-node example.ts
```
