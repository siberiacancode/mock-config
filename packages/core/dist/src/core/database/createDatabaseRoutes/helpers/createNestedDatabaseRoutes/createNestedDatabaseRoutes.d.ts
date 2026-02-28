import type { IRouter } from 'express';
import type { NestedDatabase } from '../../../../../utils/types';
import type { MemoryStorage } from '../../storages';
export declare const createNestedDatabaseRoutes: (router: IRouter, database: NestedDatabase, storage: MemoryStorage<NestedDatabase>) => IRouter;
