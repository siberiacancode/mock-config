import type { Express } from 'express';
import type { DatabaseMockServerConfig } from '../../utils/types';
export declare const createDatabaseMockServer: (databaseMockServerConfig: Omit<DatabaseMockServerConfig, "port">, server?: Express) => Express;
