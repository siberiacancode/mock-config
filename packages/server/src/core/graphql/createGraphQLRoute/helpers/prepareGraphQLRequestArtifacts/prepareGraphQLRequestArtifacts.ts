import type { GraphQLRequestArtifact } from '@/utils/types';

export const prepareGraphQLRequestArtifacts = (requestArtifacts: GraphQLRequestArtifact[]) =>
  requestArtifacts.toSorted((first, second) => second.weight - first.weight);
