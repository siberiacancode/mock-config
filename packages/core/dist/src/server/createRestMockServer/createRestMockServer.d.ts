import type { Express } from 'express';
import type { RestMockServerConfig } from '../../utils/types';
export declare const createRestMockServer: (restMockServerConfig: Omit<RestMockServerConfig, "port">, server?: Express) => Express;
