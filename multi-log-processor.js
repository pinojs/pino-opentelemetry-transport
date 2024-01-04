'use_strict'

const { callWithTimeout } = require('@opentelemetry/core')

// taken from https://github.com/open-telemetry/opentelemetry-js/blob/5fcd8cf136e2235903dde3df9ba03ced594f0e95/experimental/packages/sdk-logs/src/types.ts#L27C3-L27C26
const FORCE_FLUSH_TIMEOUT_MILLIS = 30000
/**
 * Using the MultiLogRecordProcessor from the sdk-logs package is currently not possible because it is not exported.
 * This should work as a drop-in replacement.
 */
class MultiLogRecordProcessor {
  constructor (processors, forceFlushTimeoutMillis) {
    this.processors = processors
    this.forceFlushTimeoutMillis = forceFlushTimeoutMillis
  }

  async forceFlush () {
    const timeout = this.forceFlushTimeoutMillis
    await Promise.all(
      this.processors.map(processor =>
        (FORCE_FLUSH_TIMEOUT_MILLIS, callWithTimeout)(
          processor.forceFlush(),
          timeout
        )
      )
    )
  }

  onEmit (logRecord) {
    this.processors.forEach(processors => processors.onEmit(logRecord))
  }

  async shutdown () {
    await Promise.all(this.processors.map(processor => processor.shutdown()))
  }
}

exports.MultiLogRecordProcessor = MultiLogRecordProcessor
