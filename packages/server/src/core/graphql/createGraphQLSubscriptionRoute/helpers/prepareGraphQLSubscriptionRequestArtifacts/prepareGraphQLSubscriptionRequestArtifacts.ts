import type { GraphQLSubscriptionRequestArtifact } from '@/utils/types';

export const prepareGraphQLSubscriptionRequestArtifacts = (
  requestArtifacts: GraphQLSubscriptionRequestArtifact[]
) => requestArtifacts.toSorted((first, second) => second.weight - first.weight);
