import type { MessageWsRequestArtifact } from '@/utils/types';

interface MatchMessageRequestArtifactsParams {
  artifacts: MessageWsRequestArtifact[];
  meta: {
    path: string;
  };
}

export const matchMessageRequestArtifacts = ({
  artifacts,
  meta
}: MatchMessageRequestArtifactsParams) =>
  artifacts.filter(
    (artifact) =>
      artifact.baseUrl === '/' ||
      meta.path === artifact.baseUrl ||
      meta.path.startsWith(`${artifact.baseUrl}/`)
  );
