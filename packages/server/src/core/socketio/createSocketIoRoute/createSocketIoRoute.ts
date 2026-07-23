import type { Server as SocketIOServer, Socket as SocketIOSocket } from 'socket.io';

import { Buffer } from 'node:buffer';

import type {
  Entries,
  SocketIoAcknowledgement,
  SocketIoConnectionParams,
  SocketIoConnectionRequest,
  SocketIoConnectionRequestArtifact,
  SocketIoParams,
  SocketIoRawRequestArtifact,
  SocketIoRequestArtifact
} from '@/utils/types';

import { isComparator, parseCookie, parseQuery, resolveEntityValues, sleep } from '@/utils/helpers';

import { equals } from '../../entities';

interface CreateSocketIoRouteParams {
  io: SocketIOServer;
  socketIoRequestArtifacts: SocketIoRequestArtifact[];
}

const sendSocketIoData = (socket: SocketIOSocket, data: unknown) => {
  if (data === undefined) return;
  if (typeof data === 'string') {
    socket.send(data);
    return;
  }

  const isBinary =
    data instanceof ArrayBuffer ||
    ArrayBuffer.isView(data) ||
    data instanceof Blob ||
    Buffer.isBuffer(data);
  if (isBinary) {
    socket.send(data);
    return;
  }

  socket.send(JSON.stringify(data));
};

const broadcastSocketIoData = (io: SocketIOServer, data: unknown) => {
  if (data === undefined) return;
  io.emit('message', data);
};

const emitSocketIoData = (socket: SocketIOSocket, event: string, data: unknown) => {
  if (data === undefined) return;
  socket.emit(event, data);
};

const isSocketIoAcknowledgement = (value: unknown): value is SocketIoAcknowledgement =>
  typeof value === 'function';

export const createSocketIoRoute = ({
  io,
  socketIoRequestArtifacts
}: CreateSocketIoRouteParams) => {
  const baseUrls = new Set(socketIoRequestArtifacts.map((artifact) => artifact.baseUrl));

  for (const baseUrl of baseUrls) {
    const namespace = baseUrl === '/' ? '/' : baseUrl;
    const namespaceSocketIo = io.of(namespace);
    const namespaceRequestArtifacts = socketIoRequestArtifacts.filter(
      (artifact) => artifact.baseUrl === baseUrl
    );

    namespaceSocketIo.on('connection', async (socket: SocketIOSocket) => {
      const request = socket.request as SocketIoConnectionRequest;
      const requestUrl = request.url ?? socket.handshake.url;

      const { connectionArtifacts, rawSocketIoRequestArtifacts } = namespaceRequestArtifacts.reduce(
        (acc, artifact) => {
          if (artifact.type === 'connection') acc.connectionArtifacts.push(artifact);
          if (artifact.type === 'message') acc.rawSocketIoRequestArtifacts.push(artifact);

          return acc;
        },
        {
          connectionArtifacts: [] as SocketIoConnectionRequestArtifact[],
          rawSocketIoRequestArtifacts: [] as SocketIoRawRequestArtifact[]
        }
      );

      request.queries = parseQuery(requestUrl);
      request.cookies = parseCookie(request.headers.cookie ?? '');

      for (const artifact of connectionArtifacts) {
        if (artifact.config.entities) {
          const entityEntries = Object.entries(artifact.config.entities) as Entries<
            Required<typeof artifact.config.entities>
          >;

          const isMatchedByEntities = entityEntries.every(([entityName, valueOrComparator]) => {
            const actualEntity = request[entityName];

            if (isComparator(valueOrComparator)) {
              const comparator = valueOrComparator;
              return resolveEntityValues({ actual: actualEntity, comparator });
            }

            const mappedEntityEntries = Object.entries(valueOrComparator);
            return mappedEntityEntries.every(([entityPropertyKey, valueOrComparator]) => {
              const actualPropertyKey =
                entityName === 'headers' ? entityPropertyKey.toLowerCase() : entityPropertyKey;
              const actualPropertyValue = actualEntity[actualPropertyKey];

              const comparator = isComparator(valueOrComparator)
                ? valueOrComparator
                : equals(valueOrComparator);

              return resolveEntityValues({ actual: actualPropertyValue, comparator });
            });
          });

          if (!isMatchedByEntities) continue;
        }

        const params: SocketIoConnectionParams = {
          broadcast: (data: unknown) => broadcastSocketIoData(io, data),
          request,
          socket,
          send: (data: unknown) => sendSocketIoData(socket, data),
          setDelay: async (delay: number) => {
            await sleep(delay);
          }
        };

        const resolvedData = await artifact.config.data(params);

        sendSocketIoData(socket, resolvedData);
      }

      for (const artifact of rawSocketIoRequestArtifacts) {
        socket.on(artifact.config.event, async (...receivedArgs: unknown[]) => {
          const maybeAck = receivedArgs.at(-1);
          const ack = isSocketIoAcknowledgement(maybeAck) ? maybeAck : undefined;
          const args = ack ? receivedArgs.slice(0, -1) : receivedArgs;

          const socketIoParams: SocketIoParams = {
            ack,
            args,
            broadcast: (data: unknown) => broadcastSocketIoData(io, data),
            emit: (event: string, data: unknown) => emitSocketIoData(socket, event, data),
            event: artifact.config.event,
            socket,
            send: (data: unknown) => sendSocketIoData(socket, data),
            setDelay: async (delay: number) => {
              await sleep(delay);
            }
          };

          if (artifact.componentRequestInterceptor) {
            await artifact.componentRequestInterceptor(socketIoParams);
          }

          const resolvedData = await artifact.config.data(socketIoParams);

          const data = artifact.componentResponseInterceptor
            ? await artifact.componentResponseInterceptor(resolvedData, socketIoParams)
            : resolvedData;

          if (artifact.config.settings?.delay) {
            await sleep(artifact.config.settings.delay);
          }

          sendSocketIoData(socket, data);
        });
      }
    });
  }
};

export default createSocketIoRoute;
