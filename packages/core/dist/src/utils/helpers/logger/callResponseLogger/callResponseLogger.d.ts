import type { Request, Response } from 'express';
import type { Data, Logger } from '../../../types';
interface CallResponseLoggerParams {
    data: Data;
    logger?: Logger<'response'>;
    request: Request;
    response: Response;
}
export declare const callResponseLogger: ({ logger, data, request, response }: CallResponseLoggerParams) => import("../../../types").PlainObject;
export {};
