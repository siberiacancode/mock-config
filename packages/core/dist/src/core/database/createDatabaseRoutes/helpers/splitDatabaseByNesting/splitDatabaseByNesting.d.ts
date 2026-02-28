import type { DatabaseConfig, NestedDatabase, ShallowDatabase } from '../../../../../utils/types';
export declare const splitDatabaseByNesting: (data: DatabaseConfig["data"]) => {
    shallowDatabase: ShallowDatabase;
    nestedDatabase: NestedDatabase;
};
