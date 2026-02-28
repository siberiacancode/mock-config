import type { IRouter } from 'express';
import type { Interceptors, RestConfig } from '../../../utils/types';
interface CreateRestRoutesParams {
    restConfig: RestConfig;
    router: IRouter;
    serverResponseInterceptor?: Interceptors<'rest'>['response'];
}
export declare const createRestRoutes: ({ router, restConfig, serverResponseInterceptor }: CreateRestRoutesParams) => IRouter;
export {};
