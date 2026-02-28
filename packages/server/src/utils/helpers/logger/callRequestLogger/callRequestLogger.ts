import type { Request } from 'express';

import type { Logger, LoggerOptions, LoggerTokens, RestMethod } from '@/utils/types';

import { filterTokens, formatTokens } from '../helpers';

const DEFAULT_REQUEST_LOGGER_OPTIONS: LoggerOptions<'request'> = {
  type: true,
  id: true,
  timestamp: true,
  method: true,
  url: true
};

interface CallRequestLoggerParams {
  logger?: Logger<'request'>;
  request: Request;
}

export const callRequestLogger = ({ logger, request }: CallRequestLoggerParams) => {
  const tokens: LoggerTokens<'request'> = {
    type: 'request',
    id: request.id,
    timestamp: request.timestamp,
    method: request.method.toLowerCase() as RestMethod,
    url: decodeURI(`${request.protocol}://${request.get('host')}${request.originalUrl}`),
    graphQLOperationType: request.graphQL?.operationType ?? null,
    graphQLOperationName: request.graphQL?.operationName ?? null,
    graphQLQuery: request.graphQL?.query ?? null,
    variables: request.graphQL?.variables ?? null,
    headers: request.headers,
    cookies: request.cookies,
    query: request.query,
    params: request.params,
    body: request.body
  };

  const options = logger?.options ?? DEFAULT_REQUEST_LOGGER_OPTIONS;

  const filteredTokens = filterTokens(tokens, options);

  if (logger?.rewrite) {
    logger.rewrite(filteredTokens);
    return filteredTokens;
  }

  const formattedTokens = formatTokens(filteredTokens);
  console.dir(formattedTokens, { depth: null });
  return filteredTokens;
};
