import type { Request } from 'express';
import type { Logger } from '../../../types';
interface CallRequestLoggerParams {
    logger?: Logger<'request'>;
    request: Request;
}
export declare const callRequestLogger: ({ logger, request }: CallRequestLoggerParams) => import("../../../types").PlainObject;
export {};
