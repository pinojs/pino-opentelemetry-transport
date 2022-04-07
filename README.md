# pino-opentelemetry-transport
[![npm version](https://img.shields.io/npm/v/pino-opentelemetry-transport)](https://www.npmjs.com/package/pino-opentelemetry-transport)
[![Build Status](https://img.shields.io/github/workflow/status/Vunovati/pino-opentelemetry-transport/CI)](https://github.com/Vunovati/pino-opentelemetry-transport/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/Vunovati/pino-opentelemetry-transport/badge.svg)](https://snyk.io/test/Vunovati/pino-opentelemetry-transport)
<!-- [![Coverage Status](https://coveralls.io/repos/github/Vunovati/pino-opentelemetry-transport/badge.svg?branch=main)](https://coveralls.io/github/Vunovati/pino-opentelemetry-transport?branch=main) -->
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

 Pino transport for OpenTelemetry

 ## Install

 ```
npm i pino-opentelemetry-transport
```

 ## Usage

 ```js
import { join } from 'path'
import pino from 'pino'

const transport = pino.transport({
  target: 'pino-opentelemetry-transport',
  options: { destination: 1 }
})

const logger = pino(transport)
```

(Also works in CommonJS)

## License

MIT
