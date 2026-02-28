import type { Request } from 'express';
import { parseQuery } from '../parseQuery/parseQuery';
export declare const parseGraphQLRequest: (request: Request) => ReturnType<typeof parseQuery>;
