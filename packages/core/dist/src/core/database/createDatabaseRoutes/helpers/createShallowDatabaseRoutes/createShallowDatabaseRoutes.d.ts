import type { IRouter } from 'express';
import type { ShallowDatabase } from '../../../../../utils/types';
import type { MemoryStorage } from '../../storages';
export declare const createShallowDatabaseRoutes: (router: IRouter, database: ShallowDatabase, storage: MemoryStorage<ShallowDatabase>) => IRouter;
