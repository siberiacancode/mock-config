import type { RestRequestArtifact } from '@/utils/types';

const getPathPartPriority = (part: string) => {
  if (part.includes('*')) return 2;
  if (part.startsWith(':')) return 1;
  return 0;
};

export const prepareRestRequestArtifacts = (requestArtifacts: RestRequestArtifact[]) => {
  const sortedByPathRequestArtifacts = requestArtifacts
    .toSorted((first, second) => second.weight - first.weight)
    .toSorted(({ path: firstPath }, { path: secondPath }) => {
      // ✅ important:
      // do not compare RegExp paths with string paths
      if (firstPath instanceof RegExp || secondPath instanceof RegExp) return 0;

      const firstPathParts = firstPath.split('/');
      const secondPathParts = secondPath.split('/');
      const minimalPathPartsLength = Math.min(firstPathParts.length, secondPathParts.length);

      // ✅ important:
      // prioritize more specific path parts: static segment > route parameter > wildcard
      for (let i = 0; i < minimalPathPartsLength; i += 1) {
        const firstPathPart = firstPathParts[i];
        const secondPathPart = secondPathParts[i];

        if (firstPathPart === secondPathPart) continue;

        const firstPathPartPriority = getPathPartPriority(firstPathPart);
        const secondPathPartPriority = getPathPartPriority(secondPathPart);

        if (firstPathPartPriority !== secondPathPartPriority) {
          return firstPathPartPriority - secondPathPartPriority;
        }

        return 0;
      }

      return 0;
    });

  return sortedByPathRequestArtifacts;
};
