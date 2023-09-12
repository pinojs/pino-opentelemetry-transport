/// <reference types="node" />
declare function _exports(opts: Options): Promise<import("stream").Transform & build.OnUnknown>;
export = _exports;
// import { LogRecordProcessorOptions } from './create-log-processor'

type Options = {
    loggerName: string;
    serviceVersion: string;
    messageKey?: string;
    resourceAttributes?: Record<string, string>;
    // logRecordProcessorOptions?: LogRecordProcessorOptions | LogRecordProcessorOptions[];
};

import build = require("pino-abstract-transport");
