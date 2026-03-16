'use strict'

const esbuild = require('esbuild')
const path = require('path')

const entryPoint = path.join(__dirname, '..', '..', 'lib', 'pino-opentelemetry-transport.mjs')

esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  outdir: path.join(__dirname, '..', '..', 'dist'),
  format: 'esm',
  splitting: true,
  external: ['pino-abstract-transport', 'otlp-logger', 'pino'],
  outExtension: { '.js': '.mjs' },
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
  }
}).catch(() => process.exit(1))



