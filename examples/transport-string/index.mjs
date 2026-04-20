'use strict'
import pino from 'pino'


async function main() {
    const { getBuildPath } = await import('../../lib/pino-opentelemetry-transport.mjs')

    const transport = pino.transport({
        target: getBuildPath(),
        options: {
            resourceAttributes: {
                'service.name': 'test-service',
                'service.version': '1.0.0'
            }
        }
    })

    const logger = pino(transport)

    logger.info('test message')
}

main()
