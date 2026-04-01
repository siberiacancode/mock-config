import type { RestRequestArtifact } from '@/utils/types';

import { urlJoin } from '@/utils/helpers';

export const prepareRestRequestArtifacts = (requestArtifacts: RestRequestArtifact[]) => {
  const sortedByPathRequestArtifacts = requestArtifacts
    .sort(({ path: firstPath }, { path: secondPath }) => {
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
    .sort((first, second) => second.weight - first.weight);

  return sortedByPathRequestArtifacts;
};

interface MatchRestRequestArtifactsParams {
  artifacts: RestRequestArtifact[];
  meta: {
    method: string;
    path: string;
  };
}

export const matchRestRequestArtifacts = ({ artifacts, meta }: MatchRestRequestArtifactsParams) =>
  artifacts.filter((artifact) => {
    if (artifact.method !== meta.method) return false;

    if (artifact.path instanceof RegExp) {
      return artifact.path.test(meta.path);
    }

    const artifactPath = urlJoin(artifact.baseUrl, artifact.path);

    const hasPathParams = /:[^/]+/.test(artifactPath);
    if (!hasPathParams) {
      return artifactPath === meta.path;
    }

    const regexSource = artifactPath
      .split('/')
      .map((pathPart) => {
        if (!pathPart.startsWith(':')) return pathPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return '([^/]+)';
      })
      .join('/');

    const regex = new RegExp(`^${regexSource}$`);
    return regex.test(meta.path);
  });
