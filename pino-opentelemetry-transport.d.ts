/// <reference types="node" />
declare function _exports(opts: Options): Promise<import("stream").Transform & build.OnUnknown>;
export = _exports;

type Options = {
    messageKey?: string;
};

import build = require("pino-abstract-transport");
