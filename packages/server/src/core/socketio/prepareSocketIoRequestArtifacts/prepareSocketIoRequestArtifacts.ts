import type { SocketIoRequestArtifact } from '@/utils/types';

export const prepareSocketIoRequestArtifacts = (requestArtifacts: SocketIoRequestArtifact[]) =>
  requestArtifacts.toSorted((first, second) => second.weight - first.weight);
