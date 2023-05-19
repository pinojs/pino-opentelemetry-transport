import { expectType } from "tsd";
import { OnUnknown } from "pino-abstract-transport";
import { Transform } from "stream";

import transport from "../../pino-opentelemetry-transport";

expectType<Promise<Transform & OnUnknown>>(transport({ messageKey: 'message' }));
expectType<Promise<Transform & OnUnknown>>(transport({ }));
