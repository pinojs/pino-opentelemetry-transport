import { expectType } from 'tsd'
import { OnUnknown } from 'pino-abstract-transport'
import { Transform } from 'stream'

import transport from '../../lib/pino-opentelemetry-transport'

expectType<Promise<Transform & OnUnknown>>(
  transport({
    messageKey: 'message',
    loggerName: 'test',
    serviceVersion: '1.0.0'
  })
)
expectType<Promise<Transform & OnUnknown>>(
  transport({
    messageKey: 'message',
    loggerName: 'test',
    serviceVersion: '1.0.0',
    resourceAttributes: { 'service.name': 'test' }
  })
)
expectType<Promise<Transform & OnUnknown>>(
  transport({
    loggerName: 'test',
    serviceVersion: '1.0.0'
  })
)
