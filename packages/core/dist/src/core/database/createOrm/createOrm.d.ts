import type { Database, Orm, Storage } from '../../../utils/types';
export declare const createOrm: <Data extends Database = Database>(storage: Storage) => Orm<Data>;
