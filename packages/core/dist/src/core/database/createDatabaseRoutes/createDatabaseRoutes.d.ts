import type { IRouter } from 'express';
import type { DatabaseConfig } from '../../../utils/types';
export declare const createDatabaseRoutes: (router: IRouter, { data, routes }: DatabaseConfig) => IRouter;
