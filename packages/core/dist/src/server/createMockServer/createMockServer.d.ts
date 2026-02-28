import type { Express } from 'express';
import type { MockServerConfig } from '../../utils/types';
export declare const createMockServer: (mockServerConfig: Omit<MockServerConfig, "port">, server?: Express) => Express;
