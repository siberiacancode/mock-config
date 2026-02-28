import type { Express } from 'express';
import type { GraphQLEntity, GraphQLOperationName, GraphQLOperationType, MockServerConfig } from '../../../utils/types';
declare global {
    namespace Express {
        interface Request {
            id: number;
            timestamp: number;
            graphQL: {
                operationType: GraphQLOperationType;
                operationName?: GraphQLOperationName;
                query: string;
                variables?: GraphQLEntity<'variables'>;
            } | null;
        }
    }
}
export declare const contextMiddleware: (server: Express, { database }: Pick<MockServerConfig, "database">) => void;
