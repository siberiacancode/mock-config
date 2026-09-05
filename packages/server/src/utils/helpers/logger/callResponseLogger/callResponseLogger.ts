import type { Request, Response } from 'express';

import type { Data, Logger, LoggerOptions, LoggerTokens, RestMethod } from '@/utils/types';

import { filterTokens, formatTokens } from '../helpers';

const DEFAULT_RESPONSE_LOGGER_OPTIONS: LoggerOptions<'response'> = {
  type: true,
  id: true,
  timestamp: true,
  method: true,
  url: true,
  statusCode: true,
  data: true
};

interface CallResponseLoggerParams {
  data: Data;
  logger?: Logger<'response'>;
  request: Request;
  response: Response;
}

export const callResponseLogger = ({
  logger,
  data,
  request,
  response
}: CallResponseLoggerParams) => {
  const tokens: LoggerTokens<'response'> = {
    type: 'response',
    apiType: request.api.type,
    id: request.id,
    timestamp: Date.now(),
    method: request.method.toLowerCase() as RestMethod,
    url: decodeURI(`${request.protocol}://${request.get('host')}${request.originalUrl}`),
    ...(request.api.type === 'graphql'
      ? {
          graphQLOperationType: request.api.operationType,
          graphQLOperationName: request.api.operationName ?? null,
          graphQLQuery: request.api.query,
          variables: request.api.variables ?? null
        }
      : {
          graphQLOperationType: null,
          graphQLOperationName: null,
          graphQLQuery: null,
          variables: null
        }),
    statusCode: response.statusCode,
    headers: request.headers,
    cookies: request.cookies,
    queries: request.query,
    params: request.params,
    body: request.body,
    data
  };

  const options = logger?.options ?? DEFAULT_RESPONSE_LOGGER_OPTIONS;

  const filteredTokens = filterTokens(tokens, options);

  if (logger?.rewrite) {
    logger.rewrite(filteredTokens);
    return filteredTokens;
  }

  const formattedTokens = formatTokens(filteredTokens);
  console.dir(formattedTokens, { depth: null });
  return filteredTokens;
};
