import type { GraphQLOperationType, GraphQLTransportWsOperationType, RestMethod } from './shared';
import type { Cookies, Headers, Params, PlainObject, Query } from './values';

export interface LoggerBaseTokens {
  body: any;
  cookies: Cookies;
  graphQLOperationName: string | null;
  graphQLOperationType: GraphQLOperationType | GraphQLTransportWsOperationType | null;
  graphQLQuery: string | null;
  headers: Headers;
  id: number;
  method: RestMethod;
  params: Params;
  queries: Query;
  timestamp: number;
  type: string;
  url: string;
  variables: PlainObject | null;
}

type LoggerRequestTokens = LoggerBaseTokens;

interface LoggerResponseTokens extends LoggerBaseTokens {
  data: any;
  statusCode: number;
}

export type LoggerType = 'request' | 'response';

export type LoggerTokens<Type extends LoggerType = LoggerType> = Type extends 'request'
  ? LoggerRequestTokens
  : Type extends 'response'
    ? LoggerResponseTokens
    : never;

type LoggerTokensToLoggerOptions<Type> = {
  [Key in keyof Type]?: Type[Key] extends PlainObject ? boolean | Record<string, boolean> : boolean;
};

export type LoggerOptions<Type extends LoggerType = LoggerType> = LoggerTokensToLoggerOptions<
  LoggerTokens<Type>
>;

export interface Logger<Type extends LoggerType = LoggerType> {
  options?: LoggerOptions<Type>;
  rewrite?: (tokens: Partial<LoggerTokens<Type>>) => void;
}
