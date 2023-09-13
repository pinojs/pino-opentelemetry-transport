'use strict'

const {
  SimpleLogRecordProcessor,
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter
} = require('@opentelemetry/sdk-logs')

const { MultiLogRecordProcessor } = require('./multi-log-processor')

/**
 * @param {LogRecordProcessorOptions | LogRecordProcessorOptions[]} [logRecordProcessorOptions]
 */
module.exports = function createLogProcessor (logRecordProcessorOptions) {
  return Array.isArray(logRecordProcessorOptions)
    ? new MultiLogRecordProcessor(
      logRecordProcessorOptions.map(createLogRecordProcessor)
    )
    : createLogRecordProcessor(logRecordProcessorOptions)
}

/**
 * @typedef {"batch" | "simple"} RecordProcessorType
 * @typedef {Object} LogRecordProcessorOptions
 * @property {RecordProcessorType} recordProcessorType = "batch"
 * @property {ExporterOptions} [exporterOptions]
 * @property {import('@opentelemetry/sdk-logs').BufferConfig} [processorConfig]
 *
 * @param {LogRecordProcessorOptions} [opts]
 * @returns {import('@opentelemetry/sdk-logs').LogRecordProcessor}
 */
function createLogRecordProcessor (opts) {
  const exporter = createExporter(opts?.exporterOptions)

  if (opts?.recordProcessorType === 'simple') {
    return new SimpleLogRecordProcessor(exporter)
  }

  return new BatchLogRecordProcessor(exporter, opts?.processorConfig)
}

/**
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
 * @typedef {GrpcExporterOptions | HttpExporterOptions | ProtobufExporterOptions | ConsoleExporterOptions } ExporterOptions
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

  if (exporterProtocol === 'http') {
    const {
      OTLPLogExporter
    } = require('@opentelemetry/exporter-logs-otlp-http')
    return new OTLPLogExporter(exporterOptions?.httpExporterOptions)
  }

  if (exporterProtocol === 'console') {
    return new ConsoleLogRecordExporter()
  }

  const {
    OTLPLogsExporter,
    OTLPLogExporter
  } = require('@opentelemetry/exporter-logs-otlp-proto')

  if (typeof OTLPLogExporter === 'function') {
    return new OTLPLogExporter(exporterOptions?.protobufExporterOptions)
  }

  // TODO: remove this once https://github.com/open-telemetry/opentelemetry-js/issues/3812#issuecomment-1713830883 is resolved
  return new OTLPLogsExporter(exporterOptions?.protobufExporterOptions)
}
