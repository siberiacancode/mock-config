import { parse, print, stripIgnoredCharacters } from 'graphql';

import type { GraphqlTransportWsRequestArtifact } from '@/utils/types';

import { normalizeUrl } from '@/utils/helpers';

const normalizeGraphQLDocument = (value: string) => {
  try {
    return stripIgnoredCharacters(print(parse(value)));
  } catch {
    return '';
  }
};

interface MatchGraphqlTransportWsRequestArtifactsParams {
  artifacts: GraphqlTransportWsRequestArtifact[];
  meta: {
    query?: string;
    operationName?: string;
    eventName?: string;
    path: string;
    operationType: string;
  };
}

export const matchGraphqlTransportWsRequestArtifacts = ({
  artifacts,
  meta
}: MatchGraphqlTransportWsRequestArtifactsParams) =>
  artifacts.filter((artifact) => {
    if (normalizeUrl(meta.path) !== normalizeUrl(artifact.baseUrl)) {
      return false;
    }

    if (artifact.operationType !== meta.operationType) return false;

    if (
      typeof artifact.identifier === 'string' &&
      meta.query &&
      normalizeGraphQLDocument(artifact.identifier) === normalizeGraphQLDocument(meta.query)
    )
      return true;

    if (
      artifact.identifier instanceof RegExp &&
      meta.query &&
      new RegExp(artifact.identifier).test(normalizeGraphQLDocument(meta.query))
    )
      return true;

    if (
      meta.operationName && artifact.identifier instanceof RegExp
        ? new RegExp(artifact.identifier).test(meta.operationName)
        : artifact.identifier === meta.operationName
    )
      return true;

    if (
      meta.eventName && artifact.identifier instanceof RegExp
        ? new RegExp(artifact.identifier).test(meta.eventName)
        : artifact.identifier === meta.eventName
    )
      return true;

    console.warn(`[mock-config] GraphQL artifact was skipped: ${JSON.stringify(artifact)}`);
    return false;
  });
