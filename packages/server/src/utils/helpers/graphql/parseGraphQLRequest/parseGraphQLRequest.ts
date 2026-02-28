import type { Request } from 'express';

import { getGraphQLInput } from '../getGraphQLInput/getGraphQLInput';
import { parseQuery } from '../parseQuery/parseQuery';

export const parseGraphQLRequest = (request: Request): ReturnType<typeof parseQuery> => {
  const graphQLInput = getGraphQLInput(request);
  if (!graphQLInput.query) return null;

  return parseQuery(graphQLInput.query);
};
