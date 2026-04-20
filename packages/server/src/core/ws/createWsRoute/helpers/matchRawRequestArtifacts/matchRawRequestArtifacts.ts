import type { RawWsRequestArtifact } from '@/utils/types';

interface MatchRawRequestArtifactsParams {
  artifact: RawWsRequestArtifact;
  meta: {
    path: string;
  };
}

export const matchRawRequestArtifacts = ({ artifact, meta }: MatchRawRequestArtifactsParams) =>
  artifact.baseUrl === '/' ||
  meta.path === artifact.baseUrl ||
  meta.path.startsWith(`${artifact.baseUrl}/`);
