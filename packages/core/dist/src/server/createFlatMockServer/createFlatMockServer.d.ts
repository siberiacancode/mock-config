import type { Express } from 'express';
import type { FlatMockServerConfig } from '../../utils/types';
export declare const createFlatMockServer: (flatMockServerConfig: FlatMockServerConfig, server?: Express) => Express;
