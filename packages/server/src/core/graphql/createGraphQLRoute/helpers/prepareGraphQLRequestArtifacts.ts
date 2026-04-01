import type { GraphQLRequestArtifact } from "@/utils/types";

export const prepareGraphQLRequestArtifacts = (
  requestArtifacts: GraphQLRequestArtifact[]
) => requestArtifacts.sort((first, second) => second.weight - first.weight);

export const matchGraphQLRequestArtifacts = ({
  requestArtifacts,
  graphQLQuery,
  operationType,
  operationName,
}: {
  requestArtifacts: GraphQLRequestArtifact[];
  graphQLQuery?: string;
  operationType: "query" | "mutation";
  operationName?: string;
}) =>
  requestArtifacts.filter((artifact) => {
    if (artifact.operationType !== operationType) return false;

    if (artifact.query) {
      return (
        artifact.query.replace(/\s+/g, "") === graphQLQuery?.replace(/\s+/g, "")
      );
    }

    if (artifact.operationName) {
      if (!operationName) return false;

      return artifact.operationName instanceof RegExp
        ? new RegExp(artifact.operationName).test(operationName)
        : artifact.operationName === operationName;
    }

    return true;
  });
