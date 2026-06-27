import { expectType } from 'tsd'
import type { LogRecord } from '@opentelemetry/api-logs'

import { getOtlpLogger } from '../../lib/otlp-logger-shim'

interface Logger {
  emit(obj: LogRecord): void
  shutdown(): Promise<void>;
}

expectType<Logger>(
  getOtlpLogger({
    loggerName: 'test',
    serviceVersion: '1.0.0'
  })
)
expectType<Logger>(
  getOtlpLogger({
    loggerName: 'test',
    serviceVersion: '1.0.0',
    resourceAttributes: { 'service.name': 'test' }
  })
)
expectType<Logger>(
  getOtlpLogger({
    loggerName: 'test',
    serviceVersion: '1.0.0'
  })
)
