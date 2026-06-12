'use strict'

// Portions of this file are adapted from otlp-logger (https://github.com/Vunovati/otlp-logger)
// Copyright (c) 2023 Vladimir Adamić, licensed under MIT.

const build = require('pino-abstract-transport')
const { LoggerProvider } = require('@opentelemetry/sdk-logs')
const { logs } = require('@opentelemetry/api-logs')
const api = require('@opentelemetry/api')
const {
  resourceFromAttributes,
  detectResources,
  envDetector,
  hostDetector,
  osDetector,
  processDetector,
  serviceInstanceIdDetector
} = require('@opentelemetry/resources')
const {
  SimpleLogRecordProcessor,
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter
} = require('@opentelemetry/sdk-logs')
const { toOpenTelemetry } = require('./opentelemetry-mapper')

const defaultDetectors = [
  envDetector,
  hostDetector,
  osDetector,
  processDetector,
  serviceInstanceIdDetector
]

const detectorsMapping = {
  env: envDetector,
  host: hostDetector,
  os: osDetector,
  process: processDetector,
  serviceinstance: serviceInstanceIdDetector,
  all: defaultDetectors
}

/**
 * @typedef {"batch" | "simple"} RecordProcessorType
 *
 * @typedef {Object} LogRecordProcessorOptions
 * @property {RecordProcessorType} recordProcessorType
 * @property {ExporterOptions} [exporterOptions]
 * @property {import('@opentelemetry/sdk-logs').BufferConfig} [processorConfig]
 *
 * @typedef {Object} GrpcExporterOptions
 * @property {"grpc"} protocol
 * @property {import('@opentelemetry/otlp-grpc-exporter-base').OTLPGRPCExporterConfigNode} [grpcExporterOptions]
 *
 * @typedef {Object} HttpExporterOptions
 * @property {"http"} protocol
 * @property {import('@opentelemetry/otlp-exporter-base').OTLPExporterNodeConfigBase} [httpExporterOptions]
 *
 * @typedef {Object} ProtobufExporterOptions
 * @property {"http/protobuf"} protocol
 * @property {import('@opentelemetry/otlp-exporter-base').OTLPExporterNodeConfigBase} [protobufExporterOptions]
 *
 * @typedef {Object} ConsoleExporterOptions
 * @property {"console"} protocol
 *
 * @typedef {GrpcExporterOptions | HttpExporterOptions | ProtobufExporterOptions | ConsoleExporterOptions} ExporterOptions
 *
 * @param {ExporterOptions} exporterOptions
 * @returns {import('@opentelemetry/sdk-logs').LogRecordExporter}
 */
function createExporter (exporterOptions) {
  const exporterProtocol =
    exporterOptions?.protocol ??
    process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL ??
    process.env.OTEL_EXPORTER_OTLP_PROTOCOL

  if (exporterProtocol === 'grpc') {
    const {
      OTLPLogExporter
    } = require('@opentelemetry/exporter-logs-otlp-grpc')
    return new OTLPLogExporter(exporterOptions?.grpcExporterOptions)
  }

  if (exporterProtocol === 'http' || exporterProtocol === 'http/json') {
    const {
      OTLPLogExporter
    } = require('@opentelemetry/exporter-logs-otlp-http')
    return new OTLPLogExporter(exporterOptions?.httpExporterOptions)
  }

  if (exporterProtocol === 'console') {
    return new ConsoleLogRecordExporter()
  }

  const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-proto')

  return new OTLPLogExporter(exporterOptions?.protobufExporterOptions)
}

/**
 * @param {LogRecordProcessorOptions} [opts]
 * @returns {import('@opentelemetry/sdk-logs').LogRecordProcessor}
 */
function createLogProcessor (opts) {
  const exporter = createExporter(opts?.exporterOptions)

  if (opts?.recordProcessorType === 'simple') {
    return new SimpleLogRecordProcessor(exporter)
  }

  return new BatchLogRecordProcessor(exporter, opts?.processorConfig)
}

/**
 * @typedef {Object} OtlpLoggerOptions
 * @property {string} loggerName
 * @property {string} serviceVersion
 * @property {LogRecordProcessorOptions | LogRecordProcessorOptions[]} [logRecordProcessorOptions]
 * @property {Object} [resourceAttributes={}]
 *
 * @param {OtlpLoggerOptions} opts
 * @returns {{ emit: (obj: import('@opentelemetry/api-logs').LogRecord) => void, shutdown: () => Promise<void> }}
 */
function getOtlpLogger (opts) {
  const envValue = (process.env.OTEL_NODE_RESOURCE_DETECTORS || '').trim()
  const detectorNames = envValue ? envValue.split(',').map(s => s.trim()) : []
  const detectors = envValue
    ? detectorNames.includes('none')
      ? []
      : detectorNames.map(s => detectorsMapping[s]).flat().filter(Boolean)
    : defaultDetectors

  const detectedResource = detectResources({ detectors })

  const logRecordProcessorOptionsArray = Array.isArray(
    opts.logRecordProcessorOptions
  )
    ? opts.logRecordProcessorOptions
    : [opts.logRecordProcessorOptions]

  const loggerProvider = new LoggerProvider({
    resource: detectedResource.merge(
      resourceFromAttributes({ ...opts.resourceAttributes })
    ),
    processors: logRecordProcessorOptionsArray.map(
      (logRecordProcessorOptions) =>
        createLogProcessor(logRecordProcessorOptions)
    )
  })

  logs.setGlobalLoggerProvider(loggerProvider)

  const logger = loggerProvider.getLogger(opts.loggerName, opts.serviceVersion)

  return {
    /**
     * @param {import('@opentelemetry/api-logs').LogRecord} obj
     */
    emit (obj) {
      logger.emit(loadContext(obj))
    },
    async shutdown () {
      return loggerProvider.shutdown()
    }
  }
}

/**
 * Load context from attributes and set it to logRecord.context
 *
 * @param {import('@opentelemetry/api-logs').LogRecord} logRecord
 * @returns {import('@opentelemetry/api-logs').LogRecord}
 */
function loadContext (logRecord) {
  let context = api.context.active()
  let attributes = logRecord.attributes

  if (typeof attributes !== 'undefined') {
    /* eslint-disable camelcase */
    const { trace_id, span_id, trace_flags, ...otherAttributes } =
      logRecord.attributes

    if (
      typeof trace_id !== 'undefined' &&
      typeof span_id !== 'undefined' &&
      typeof trace_flags !== 'undefined'
    ) {
      context = api.trace.setSpanContext(context, {
        traceId: trace_id,
        spanId: span_id,
        traceFlags: trace_flags,
        isRemote: true
      })
    }

    attributes = otherAttributes
    /* eslint-enable camelcase */
  }

  return {
    ...logRecord,
    attributes,
    context
  }
}

/**
 * Pino OpenTelemetry transport
 *
 * @typedef {Object} PinoOptions
 * @property {Object.<number, number>} [severityNumberMap]
 *
 * @typedef {OtlpLoggerOptions & PinoOptions} Options
 *
 * @param {Options} opts
 */
module.exports = async function ({ severityNumberMap, ...loggerOpts } = {}) {
  const logger = getOtlpLogger(loggerOpts)

  return build(
    async function (/** @type { AsyncIterable<Bindings> } */ source) {
      const mapperOptions = {
        messageKey: source.messageKey,
        levels: source.levels,
        severityNumberMap
      }
      for await (const obj of source) {
        logger.emit(toOpenTelemetry(obj, mapperOptions))
      }
    },
    {
      async close () {
        return logger.shutdown()
      },
      expectPinoConfig: true
    }
  )
}
