import type { Request } from 'express';

import { getGraphQLInput } from '../getGraphQLInput/getGraphQLInput';
import { parseGraphQLQuery } from '../parseGraphQLQuery/parseGraphQLQuery';

export const parseGraphQLRequest = (request: Request): ReturnType<typeof parseGraphQLQuery> => {
  const graphQLInput = getGraphQLInput(request);
  if (!graphQLInput.query) return null;

  return parseGraphQLQuery(graphQLInput.query);
};
