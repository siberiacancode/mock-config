import { z } from 'zod';

export const getMostSpecificPathFromError = (error: z.ZodError): (number | string)[] => {
  let currentMostSpecificPath: (number | string)[] = [];
  for (const issue of error.issues) {
    if (issue.code === z.ZodIssueCode.invalid_union) {
      for (const unionError of issue.unionErrors) {
        const unionErrorMostSpecificPath = getMostSpecificPathFromError(unionError);
        if (unionErrorMostSpecificPath.length > currentMostSpecificPath.length) {
          currentMostSpecificPath = unionErrorMostSpecificPath;
        }
      }
      continue;
    }

    if (issue.code === z.ZodIssueCode.unrecognized_keys) {
      const [unrecognizedKey] = issue.keys;
      const issuePath = [...issue.path, unrecognizedKey];
      if (issuePath.length > currentMostSpecificPath.length) {
        currentMostSpecificPath = issuePath;
      }
      continue;
    }

    if (issue.path.length > currentMostSpecificPath.length) {
      currentMostSpecificPath = issue.path;
    }
  }

  return currentMostSpecificPath;
};
