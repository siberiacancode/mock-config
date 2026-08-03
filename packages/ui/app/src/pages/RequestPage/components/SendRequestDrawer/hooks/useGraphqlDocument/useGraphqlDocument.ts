import { useState } from 'react';

import type { RouteEntry } from '../../../../types';
import type { GraphqlDocument, SendTarget } from '../../types';

import { buildGraphqlQuery, getGraphqlQueryWarning, parseGraphqlVariables } from '../../adapter';
import { resolveBody } from '../../helpers';

const createDocument = (route: RouteEntry | undefined, target: SendTarget): GraphqlDocument => {
  if (target.type !== 'graphql') return { query: '', variables: '' };

  return {
    query: buildGraphqlQuery(target.identifier, target.operationType),
    variables: resolveBody(route?.entities?.variables).body ?? ''
  };
};

export const useGraphqlDocument = (route: RouteEntry | undefined, target: SendTarget) => {
  const [document, setDocument] = useState(() => createDocument(route, target));

  if (target.type !== 'graphql') return undefined;

  const variables = parseGraphqlVariables(document.variables);
  const isVariablesMissing = Boolean(route?.entities?.variables) && !document.variables.trim();

  return {
    document,
    setQuery: (query: string) => setDocument((previous) => ({ ...previous, query })),
    setVariables: (value: string) => setDocument((previous) => ({ ...previous, variables: value })),
    warnings: [
      getGraphqlQueryWarning(target.identifier),
      variables.error,
      isVariablesMissing
        ? 'variables — the route matches on them, but the field is empty'
        : undefined
    ].filter((warning) => warning !== undefined)
  };
};
