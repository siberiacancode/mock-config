import type { Request } from 'express';
import type { PlainObject } from '../../../types';
interface GetGraphQLInputResult {
    query: string | undefined;
    variables: PlainObject | undefined;
}
export declare const getGraphQLInput: (request: Request) => GetGraphQLInputResult;
export {};
