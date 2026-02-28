import type { Request, Response } from 'express';
import type { Data, ResponseInterceptor } from '../../../types';
interface CallResponseInterceptorsParams {
    data: Data;
    request: Request;
    response: Response;
    interceptors?: {
        routeInterceptor?: ResponseInterceptor;
        requestInterceptor?: ResponseInterceptor;
        apiInterceptor?: ResponseInterceptor;
        serverInterceptor?: ResponseInterceptor;
    };
}
export declare const callResponseInterceptors: (params: CallResponseInterceptorsParams) => Promise<Data>;
export {};
