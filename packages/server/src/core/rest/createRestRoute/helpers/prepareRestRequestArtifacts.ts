import type { RestRequestArtifact } from '@/utils/types';

import { urlJoin } from '@/utils/helpers';

export const prepareRestRequestArtifacts = (requestArtifacts: RestRequestArtifact[]) => {
  const sortedByPathRequestArtifacts = requestArtifacts
    .toSorted(({ path: firstPath }, { path: secondPath }) => {
      // ✅ important:
      // do not compare RegExp paths and non-parameterized paths
      if (firstPath instanceof RegExp || secondPath instanceof RegExp) return 0;
      if (!firstPath.includes('/:') && !secondPath.includes('/:')) return 0;

      const firstPathParts = firstPath.split('/');
      const secondPathParts = secondPath.split('/');
      const minimalPathPartsLength = Math.min(firstPathParts.length, secondPathParts.length);

      // ✅ important:
      // need to find the leftmost parameter/non-parameter pair and give priority to non-parameter one
      for (let i = 0; i < minimalPathPartsLength; i += 1) {
        const firstPathPart = firstPathParts[i];
        const secondPathPart = secondPathParts[i];

        const isFirstPathPartParameter = firstPathPart.startsWith(':');
        const isSecondPathPartParameter = secondPathPart.startsWith(':');

        if (!isFirstPathPartParameter && !isSecondPathPartParameter) {
          if (firstPathPart === secondPathPart) continue;
          return 0;
        }

        if (isFirstPathPartParameter && isSecondPathPartParameter) continue;

        return +isFirstPathPartParameter - +isSecondPathPartParameter;
      }
      return 0;
    })
    .toSorted((first, second) => second.weight - first.weight);

  return sortedByPathRequestArtifacts;
};

interface MatchRestRequestArtifactsParams {
  artifacts: RestRequestArtifact[];
  meta: {
    method: string;
    path: string;
  };
}

export const generatePathRegex = (path: string) =>
  new RegExp(
    `^${path
      .split('/')
      .map((part) =>
        part.startsWith(':') ? '([^/]+)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      )
      .join('/')}$`
  );

export const matchRestRequestArtifacts = ({ artifacts, meta }: MatchRestRequestArtifactsParams) =>
  artifacts.filter((artifact) => {
    if (!meta.path.startsWith(artifact.baseUrl)) return false;

    if (artifact.method !== meta.method) return false;

    if (artifact.path instanceof RegExp) {
      if (artifact.baseUrl === '/') return artifact.path.test(meta.path);
      const path = meta.path.slice(artifact.baseUrl.length);
      if (!path) return false;
      return artifact.path.test(path);
    }

    return generatePathRegex(urlJoin(artifact.baseUrl, artifact.path)).test(meta.path);
  });
