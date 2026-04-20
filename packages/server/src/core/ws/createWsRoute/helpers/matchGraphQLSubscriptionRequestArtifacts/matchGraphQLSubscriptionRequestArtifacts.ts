import { parse, print, stripIgnoredCharacters } from 'graphql';

import type { GraphQLWsRequestArtifact } from '@/utils/types';

import { normalizeUrl } from '@/utils/helpers';

interface MatchGraphQLSubscriptionRequestArtifactsParams {
  artifact: GraphQLWsRequestArtifact;
  meta: {
    path: string;
    operationType: string;
    query?: string;
    operationName?: string;
  };
}

export const matchGraphQLSubscriptionRequestArtifacts = ({
  artifact,
  meta
}: MatchGraphQLSubscriptionRequestArtifactsParams) => {
  if (normalizeUrl(meta.path) !== normalizeUrl(artifact.baseUrl)) {
    return false;
  }

  if (artifact.operationType !== meta.operationType) return false;

  if (artifact.query) {
    if (!meta.query) return false;
    return (
      stripIgnoredCharacters(print(parse(artifact.query))) ===
      stripIgnoredCharacters(print(parse(meta.query)))
    );
  }

  if (artifact.operationName) {
    if (!meta.operationName) return false;
    return artifact.operationName instanceof RegExp
      ? new RegExp(artifact.operationName).test(meta.operationName)
      : artifact.operationName === meta.operationName;
  }

  console.warn(
    `[mock-config] GraphQL subscription artifact with no query or operationName was skipped: ${JSON.stringify(
      artifact
    )}`
  );
  return false;
};
