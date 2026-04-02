import type { RestRequestArtifact } from '@/utils/types';

import { urlJoin } from '@/utils/helpers';

export const generatePathRegex = (path: string) =>
  new RegExp(
    `^${path
      .split('/')
      .map((part) =>
        part.startsWith(':') ? '([^/]+)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      )
      .join('/')}$`
  );

interface MatchRestRequestArtifactsParams {
  artifacts: RestRequestArtifact[];
  meta: {
    method: string;
    path: string;
  };
}

export const matchRestRequestArtifacts = ({ artifacts, meta }: MatchRestRequestArtifactsParams) =>
  artifacts.filter((artifact) => {
    if (!meta.path.startsWith(artifact.baseUrl)) return false;

    if (artifact.method !== meta.method) return false;

    if (artifact.path instanceof RegExp) {
      if (artifact.baseUrl === '/') return artifact.path.test(meta.path);
      const tail = meta.path === artifact.baseUrl ? '' : meta.path.slice(artifact.baseUrl.length);
      if (!tail) return false;
      return artifact.path.test(tail);
    }

    return generatePathRegex(urlJoin(artifact.baseUrl, artifact.path)).test(meta.path);
  });
