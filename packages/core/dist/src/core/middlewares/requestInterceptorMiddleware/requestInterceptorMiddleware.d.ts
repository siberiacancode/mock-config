import type { Express } from 'express';
import type { RequestInterceptor } from '../../../utils/types';
interface RequestInterceptorMiddlewareParams {
    interceptor: RequestInterceptor;
    path?: string;
    server: Express;
}
export declare const requestInterceptorMiddleware: ({ server, path, interceptor }: RequestInterceptorMiddlewareParams) => void;
export {};
