import type { RawWsRequestArtifact } from '@/utils/types';

interface MatchRawRequestArtifactsParams {
  artifacts: RawWsRequestArtifact[];
  meta: {
    path: string;
  };
}

export const matchRawRequestArtifacts = ({ artifacts, meta }: MatchRawRequestArtifactsParams) =>
  artifacts.filter(
    (artifact) =>
      artifact.baseUrl === '/' ||
      meta.path === artifact.baseUrl ||
      meta.path.startsWith(`${artifact.baseUrl}/`)
  );
