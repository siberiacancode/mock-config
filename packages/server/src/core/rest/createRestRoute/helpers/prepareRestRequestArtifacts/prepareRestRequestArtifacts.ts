import type { RestRequestArtifact } from '@/utils/types';

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
