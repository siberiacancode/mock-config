import type { Express } from 'express';
import type { BaseUrl, StaticPath } from '../../../utils/types';
export declare const staticMiddleware: (server: Express, baseUrl: BaseUrl, staticPath: StaticPath) => void;
