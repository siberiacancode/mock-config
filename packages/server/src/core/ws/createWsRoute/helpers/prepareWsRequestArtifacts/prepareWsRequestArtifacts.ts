import type { WsRequestArtifact } from '@/utils/types';

export const prepareWsRequestArtifacts = (requestArtifacts: WsRequestArtifact[]) =>
  requestArtifacts.toSorted((first, second) => second.weight - first.weight);
