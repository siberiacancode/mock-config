import type { z } from 'zod';

// ✅ important:
// need to use exclude symbol because zod intentionally doesn't handle it
// as others JS core features: Object.keys, for...in, JSON.stringify
export const getMostSpecificPathFromError = (issues: z.core.$ZodIssue[]) => {
  let mostSpecificPath: (number | string)[] = [];
  for (const issue of issues) {
    if (issue.code === 'invalid_union') {
      for (const unionError of issue.errors) {
        const unionErrorMostSpecificPath = getMostSpecificPathFromError(unionError);
        if (unionErrorMostSpecificPath.length > mostSpecificPath.length) {
          mostSpecificPath = unionErrorMostSpecificPath;
        }
      }
      continue;
    }

    if (issue.code === 'unrecognized_keys') {
      const [unrecognizedKey] = issue.keys;
      const issuePath = [...issue.path, unrecognizedKey];
      if (issuePath.length > mostSpecificPath.length) {
        mostSpecificPath = issuePath as (number | string)[];
      }
      continue;
    }

    if (issue.path.length > mostSpecificPath.length) {
      mostSpecificPath = issue.path as (number | string)[];
    }
  }

  return mostSpecificPath;
};
