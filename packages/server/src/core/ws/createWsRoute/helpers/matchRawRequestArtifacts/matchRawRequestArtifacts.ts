import type { WsRequestArtifact } from '@/utils/types';

interface MatchRawRequestArtifactsParams {
  artifacts: WsRequestArtifact[];
  meta: {
    path: string;
  };
}

export const matchRawRequestArtifacts = ({ artifacts, meta }: MatchRawRequestArtifactsParams) =>
  artifacts.filter(
    (artifact) =>
      artifact.type === 'raw' &&
      (artifact.baseUrl === '/' ||
        meta.path === artifact.baseUrl ||
        meta.path.startsWith(`${artifact.baseUrl}/`))
  );
