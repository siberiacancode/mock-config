import type { GraphQLRequestArtifact } from '@/utils/types';

export const prepareGraphQLRequestArtifacts = (requestArtifacts: GraphQLRequestArtifact[]) =>
  requestArtifacts.sort((first, second) => second.weight - first.weight);

interface MatchGraphQLRequestArtifactsParams {
  artifacts: GraphQLRequestArtifact[];
  meta: {
    path: string;
    operationType: string;
    query?: string;
    operationName?: string;
  };
}

export const matchGraphQLRequestArtifacts = ({
  artifacts,
  meta
}: MatchGraphQLRequestArtifactsParams) =>
  artifacts.filter((artifact) => {
    if (meta.path !== artifact.baseUrl) return false;

    if (artifact.operationType !== meta.operationType) return false;

    if (artifact.query) {
      if (!meta.query) return false;
      return artifact.query.replace(/\s+/g, '') === meta.query.replace(/\s+/g, '');
    }

    if (artifact.operationName) {
      if (!meta.operationName) return false;
      return artifact.operationName instanceof RegExp
        ? new RegExp(artifact.operationName).test(meta.operationName)
        : artifact.operationName === meta.operationName;
    }

    throw new Error('Unmatched graphql request');
  });
