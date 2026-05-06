import { parse, print, stripIgnoredCharacters } from 'graphql';

import type { GraphqlTransportWsRequestArtifact } from '@/utils/types';

import { normalizeUrl } from '@/utils/helpers';

interface MatchGraphqlTransportWsRequestArtifactsParams {
  artifacts: GraphqlTransportWsRequestArtifact[];
  meta: {
    eventName?: string;
    path: string;
    operationType: string;
    query?: string;
    operationName?: string;
  };
}

export const matchGraphqlTransportWsRequestArtifacts = ({
  artifacts,
  meta
}: MatchGraphqlTransportWsRequestArtifactsParams) =>
  artifacts.filter((artifact) => {
    if (normalizeUrl(meta.path) !== normalizeUrl(artifact.baseUrl)) return false;

    if (artifact.operationType !== meta.operationType) return false;

    if (artifact.query) {
      if (!meta.query) return false;
      return (
        stripIgnoredCharacters(print(parse(artifact.query))) ===
        stripIgnoredCharacters(print(parse(meta.query)))
      );
    }

    if (artifact.eventName) {
      if (!meta.eventName) return false;
      return artifact.eventName instanceof RegExp
        ? new RegExp(artifact.eventName).test(meta.eventName)
        : artifact.eventName === meta.eventName;
    }

    if (artifact.operationName) {
      if (!meta.operationName) return false;
      return artifact.operationName instanceof RegExp
        ? new RegExp(artifact.operationName).test(meta.operationName)
        : artifact.operationName === meta.operationName;
    }

    console.warn(
      `[mock-config] GraphQL subscription artifact with no query, eventName or operationName was skipped: ${JSON.stringify(
        artifact
      )}`
    );
    return false;
  });
