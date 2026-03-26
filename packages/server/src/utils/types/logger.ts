import type { GraphQLOperationName, GraphQLOperationType } from './graphql';
import type { RestMethod } from './rest';
import type { ApiType } from './shared';
import type { Cookies, Headers, Params, PlainObject, Query } from './values';

export interface LoggerBaseTokens {
  body: any;
  cookies: Cookies;
  headers: Headers;
  id: number;
  method: RestMethod;
  params: Params;
  query: Query;
  timestamp: number;
  type: string;
  url: string;
}

interface LoggerRestRequestTokens extends LoggerBaseTokens {}

interface LoggerRestResponseTokens extends LoggerRestRequestTokens {
  data: any;
  statusCode: number;
}

interface LoggerGraphQLRequestTokens extends LoggerBaseTokens {
  graphQLOperationName: GraphQLOperationName | null;
  graphQLOperationType: GraphQLOperationType | null;
  graphQLQuery: string | null;
  variables: PlainObject | null;
}

interface LoggerGraphQLResponseTokens extends LoggerGraphQLRequestTokens {
  data: any;
  statusCode: number;
}

export type LoggerType = 'request' | 'response';

export type LoggerTokens<
  Type extends LoggerType = LoggerType,
  Api extends ApiType = ApiType
> = Type extends 'request'
  ? Api extends 'rest'
    ? LoggerRestRequestTokens
    : Api extends 'graphql'
      ? LoggerGraphQLRequestTokens
      : never
  : Type extends 'response'
    ? Api extends 'rest'
      ? LoggerRestResponseTokens
      : Api extends 'graphql'
        ? LoggerGraphQLResponseTokens
        : never
    : never;

type LoggerTokensToLoggerOptions<Type> = {
  [Key in keyof Type]?: Type[Key] extends PlainObject ? boolean | Record<string, boolean> : boolean;
};

export type LoggerOptions<
  Type extends LoggerType = LoggerType,
  Api extends ApiType = ApiType
> = LoggerTokensToLoggerOptions<LoggerTokens<Type, Api>>;

export interface Logger<Type extends LoggerType = LoggerType, Api extends ApiType = ApiType> {
  options?: LoggerOptions<Type, Api>;
  rewrite?: (tokens: Partial<LoggerTokens<Type, Api>>) => void;
}
