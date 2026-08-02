import type { z } from 'zod';

// TODO:
// improve validation message with more detailed description
// as types and link to the documentation
const getValidationMessageFromPath = (path: (number | string)[]) =>
  path.reduce<string>((validationMessageAcc, pathElement) => {
    if (typeof pathElement === 'number') return `${validationMessageAcc}[${pathElement}]`;
    return `${validationMessageAcc}.${pathElement}`;
  }, '');

export const getMostSpecificPathFromError = (issues: z.core.$ZodIssue[]): (number | string)[] => {
  let mostSpecificPath: (number | string)[] = [];

  for (const issue of issues) {
    if (issue.code === 'invalid_union') {
      for (const unionError of issue.errors) {
        const nestedPath = getMostSpecificPathFromError(unionError);
        const combinedPath = [...issue.path, ...nestedPath];
        if (combinedPath.length > mostSpecificPath.length) {
          mostSpecificPath = combinedPath as (number | string)[];
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

export const getValidationMessage = (issues: z.core.$ZodIssue[]) => {
  const path = getMostSpecificPathFromError(issues);
  return getValidationMessageFromPath(path);
};
