import type { EntityRow, GraphqlDocument, RequestPayload } from '../types';

import { joinPath, toCookieHeader, toRecord } from '../helpers';

interface BuildGraphqlPayloadOptions {
  componentBaseUrl?: string;
  document: GraphqlDocument;
  entityRows: Record<string, EntityRow[]>;
}

const OPERATION_NAME = /^[_A-Z]\w*$/i;

const isDocument = (identifier: string) => identifier.includes('{');

export const buildGraphqlQuery = (identifier: string, operationType: string) => {
  if (isDocument(identifier)) return identifier;
  if (OPERATION_NAME.test(identifier)) return `${operationType} ${identifier} {\n  __typename\n}`;

  return `${operationType} {\n  __typename\n}`;
};

export const getGraphqlQueryWarning = (identifier: string) => {
  if (isDocument(identifier) || OPERATION_NAME.test(identifier)) return undefined;

  return `identifier ${identifier} is a pattern, not an operation name — write the query by hand`;
};

export const parseGraphqlVariables = (variables: string) => {
  if (!variables.trim()) return { value: undefined };

  try {
    return { value: JSON.parse(variables) };
  } catch {
    return { error: 'variables — not valid json' };
  }
};

export const buildGraphqlPayload = (options: BuildGraphqlPayloadOptions): RequestPayload => {
  const search = new URLSearchParams(toRecord(options.entityRows.queries)).toString();
  const cookie = toCookieHeader(options.entityRows.cookies);
  const variables = parseGraphqlVariables(options.document.variables);

  return {
    method: 'post',
    path: `${joinPath(options.componentBaseUrl)}${search ? `?${search}` : ''}`,
    headers: {
      'Content-Type': 'application/json',
      ...toRecord(options.entityRows.headers),
      ...(cookie && { Cookie: cookie })
    },
    body: JSON.stringify({
      query: options.document.query,
      ...(variables.value !== undefined && { variables: variables.value })
    })
  };
};
