import type { RestRequestArtifact } from "@/utils/types";

import { urlJoin } from "@/utils/helpers";

export const prepareRestRequestArtifacts = (
  requestArtifacts: RestRequestArtifact[]
) => {
  const sortedByPathRequestArtifacts = requestArtifacts
    .sort(({ path: firstPath }, { path: secondPath }) => {
      // ✅ important:
      // do not compare RegExp paths and non-parameterized paths
      if (firstPath instanceof RegExp || secondPath instanceof RegExp) return 0;
      if (!firstPath.includes("/:") && !secondPath.includes("/:")) return 0;

      const firstPathParts = firstPath.split("/");
      const secondPathParts = secondPath.split("/");
      const minimalPathPartsLength = Math.min(
        firstPathParts.length,
        secondPathParts.length
      );

      // ✅ important:
      // need to find the leftmost parameter/non-parameter pair and give priority to non-parameter one
      for (let i = 0; i < minimalPathPartsLength; i += 1) {
        const firstPathPart = firstPathParts[i];
        const secondPathPart = secondPathParts[i];

        const isFirstPathPartParameter = firstPathPart.startsWith(":");
        const isSecondPathPartParameter = secondPathPart.startsWith(":");

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

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getRestPathParamsByPattern = (
  artifactPath: string,
  requestPath: string
): Record<string, string> | null => {
  const hasPathParams = /:[^/]+/.test(artifactPath);
  if (!hasPathParams) return artifactPath === requestPath ? {} : null;

  const paramNames: string[] = [];
  const regexSource = artifactPath
    .split("/")
    .map((pathPart) => {
      if (!pathPart.startsWith(":")) return escapeRegExp(pathPart);
      const paramName = pathPart.slice(1);
      if (!paramName) return "";
      paramNames.push(paramName);
      return "([^/]+)";
    })
    .join("/");

  const match = requestPath.match(new RegExp(`^${regexSource}$`));
  if (!match) return null;

  const params: Record<string, string> = {};
  paramNames.forEach((paramName, index) => {
    const value = match[index + 1];
    params[paramName] = value ? decodeURIComponent(value) : "";
  });

  return params;
};

export const matchRestRequestArtifacts = ({
  requestArtifacts,
  requestMethod,
  requestPath,
}: {
  requestArtifacts: RestRequestArtifact[];
  requestMethod: string;
  requestPath: string;
}) =>
  requestArtifacts
    .map((artifact) => {
      if (artifact.method !== requestMethod) return null;

      if (artifact.path instanceof RegExp) {
        return artifact.path.test(requestPath)
          ? { artifact, pathParams: {} }
          : null;
      }

      const artifactFullPath = urlJoin(artifact.baseUrl, artifact.path);
      const pathParams = getRestPathParamsByPattern(
        artifactFullPath,
        requestPath
      );
      if (pathParams === null) return null;

      return { artifact, pathParams };
    })
    .filter(
      (
        item
      ): item is {
        artifact: RestRequestArtifact;
        pathParams: Record<string, string>;
      } => Boolean(item)
    );
