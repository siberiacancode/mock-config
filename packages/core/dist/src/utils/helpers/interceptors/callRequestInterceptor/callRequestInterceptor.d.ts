import type { Request } from 'express';
import type { RequestInterceptor } from '../../../types';
interface CallRequestInterceptorParams {
    interceptor: RequestInterceptor;
    request: Request;
}
export declare const callRequestInterceptor: (params: CallRequestInterceptorParams) => Promise<void>;
export {};
