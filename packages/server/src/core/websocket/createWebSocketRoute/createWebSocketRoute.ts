import { flatten } from 'flat';
import type { Server } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocket } from 'ws';

import type { Request } from 'express';
import { WebSocketServer } from 'ws';

import type {
  EntityDescriptor,
  MessagePlainEntity,
  WebSocketInterceptors,
  WebSocketRouteConfig
} from '@/utils/types';

import { parseCookie } from '@/core/middlewares/cookieParseMiddleware/helpers/parseCookie/parseCookie';
import {
  convertToEntityDescriptor,
  isEntityDescriptor,
  isPlainObject,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

export interface WebSocketArtifact {
  baseUrl: string;
  componentInterceptors?: WebSocketInterceptors;
  event: RegExp | string;
  requestInterceptors?: WebSocketInterceptors;
  routes: WebSocketRouteConfig[];
  serverInterceptors?: WebSocketInterceptors;
}

interface CreateWebSocketRouteParams {
  httpServer: Server;
  webSocketArtifacts: WebSocketArtifact[];
}

const parseIncomingSocketMessage = (value: Buffer | Buffer[] | string) => {
  const raw = Array.isArray(value)
    ? Buffer.concat(value).toString('utf-8')
    : Buffer.isBuffer(value)
      ? value.toString('utf-8')
      : String(value);

  try {
    const parsed = JSON.parse(raw);
    if (isPlainObject(parsed)) {
      return {
        raw,
        parsed,
        event: typeof parsed.event === 'string' ? parsed.event : undefined
      };
    }
  } catch {
    // keep raw as-is if parse failed
  }

  return {
    raw,
    parsed: undefined,
    event: undefined
  };
};

const isPathMatchedByBaseUrl = (path: string, baseUrl: string) => {
  if (baseUrl === '/') return true;
  return path === baseUrl || path.startsWith(`${baseUrl}/`);
};

const isMappedEntityMatched = (descriptor: Record<string, any>, actualValue: Record<string, any>) => {
  const flattenActualValue = flatten<Record<string, any>, Record<string, any>>(actualValue);
  return Object.entries(descriptor).every(([key, value]) => {
    const descriptorEntity = convertToEntityDescriptor(value);
    const actualKey = key.toLowerCase();
    const actualEntityValue = flattenActualValue[actualKey];

    if (descriptorEntity.checkMode === 'exists' || descriptorEntity.checkMode === 'notExists') {
      return resolveEntityValues({
        actualValue: actualEntityValue,
        checkMode: descriptorEntity.checkMode
      });
    }

    return resolveEntityValues({
      actualValue: actualEntityValue,
      checkMode: descriptorEntity.checkMode,
      descriptorValue: descriptorEntity.value,
      oneOf: descriptorEntity.oneOf ?? false
    });
  });
};

const isMessageEntityMatched = (
  messageDescriptor: MessagePlainEntity,
  messageValue: Record<string, any>
) => {
  if (isEntityDescriptor(messageDescriptor)) {
    const descriptor = messageDescriptor as EntityDescriptor;
    if (descriptor.checkMode === 'exists' || descriptor.checkMode === 'notExists') {
      return resolveEntityValues({
        actualValue: messageValue,
        checkMode: descriptor.checkMode
      });
    }

    return resolveEntityValues({
      actualValue: messageValue,
      descriptorValue: descriptor.value,
      checkMode: descriptor.checkMode,
      oneOf: descriptor.oneOf ?? false
    });
  }

  if (Array.isArray(messageDescriptor)) {
    return resolveEntityValues({
      actualValue: messageValue,
      descriptorValue: messageDescriptor,
      checkMode: 'equals'
    });
  }

  return isMappedEntityMatched(messageDescriptor, messageValue);
};

const isRouteMatched = (
  route: WebSocketRouteConfig,
  params: {
    cookies: Record<string, string>;
    headers: Record<string, any>;
    message: Record<string, any>;
    query: Record<string, string>;
  }
) => {
  if (!route.entities) return true;

  return Object.entries(route.entities).every(([entityName, descriptor]) => {
    if (!descriptor) return true;
    if (entityName === 'headers') {
      return isMappedEntityMatched(descriptor, params.headers);
    }
    if (entityName === 'cookies') {
      return isMappedEntityMatched(descriptor, params.cookies);
    }
    if (entityName === 'query') {
      return isMappedEntityMatched(descriptor, params.query);
    }
    if (entityName === 'message') {
      return isMessageEntityMatched(descriptor as MessagePlainEntity, params.message);
    }

    return true;
  });
};

const callWebSocketRequestInterceptor = async (
  interceptor: WebSocketInterceptors['request'],
  params: Parameters<NonNullable<WebSocketInterceptors['request']>>[0]
) => {
  if (!interceptor) return;
  await interceptor(params);
};

const callWebSocketResponseInterceptor = async (
  interceptor: WebSocketInterceptors['response'],
  event: any,
  params: Parameters<NonNullable<WebSocketInterceptors['response']>>[1]
) => {
  if (!interceptor) return event;
  return interceptor(event, params);
};

export const createWebSocketRoute = ({ httpServer, webSocketArtifacts }: CreateWebSocketRouteParams) => {
  if (!webSocketArtifacts.length) return;

  const webSocketServer = new WebSocketServer({ noServer: true });
  let connectionId = 0;

  httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
    const requestPath = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
      .pathname;

    const isWebSocketPath = webSocketArtifacts.some((artifact) =>
      isPathMatchedByBaseUrl(requestPath, artifact.baseUrl)
    );
    if (!isWebSocketPath) {
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (websocket: WebSocket) => {
      webSocketServer.emit('connection', websocket, request);
    });
  });

  webSocketServer.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    connectionId += 1;
    const currentConnectionId = String(connectionId);
    const requestPath = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
      .pathname;
    const cookies = parseCookie(request.headers.cookie ?? '');
    const query = Object.fromEntries(
      new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).searchParams
    );

    socket.on('message', async (message: RawData) => {
      const normalizedMessage = parseIncomingSocketMessage(message as Buffer | Buffer[] | string);
      const messageEvent = normalizedMessage.event ?? normalizedMessage.raw;
      const messageValue = normalizedMessage.parsed ?? { raw: normalizedMessage.raw };
      const headers = request.headers as Record<string, any>;

      const matchedArtifact = webSocketArtifacts.find((artifact) => {
        const isBaseUrlMatched = isPathMatchedByBaseUrl(requestPath, artifact.baseUrl);
        if (!isBaseUrlMatched) return false;

        if (artifact.event instanceof RegExp) return artifact.event.test(messageEvent);
        return artifact.event === messageEvent;
      });
      if (!matchedArtifact) return;

      const matchedRoute = matchedArtifact.routes.find((route) =>
        isRouteMatched(route, {
          headers,
          cookies,
          query,
          message: messageValue
        })
      );
      if (!matchedRoute) return;

      let delay = matchedRoute.settings?.delay ?? 0;
      const context = {
        connectionId: currentConnectionId,
        socket,
        event: normalizedMessage.event,
        message: {
          raw: normalizedMessage.raw,
          parsed: normalizedMessage.parsed
        }
      };
      const interceptorContextParams = {
        request,
        socket,
        context
      };

      await callWebSocketRequestInterceptor(
        matchedArtifact.serverInterceptors?.request,
        interceptorContextParams
      );
      await callWebSocketRequestInterceptor(
        matchedArtifact.componentInterceptors?.request,
        interceptorContextParams
      );
      await callWebSocketRequestInterceptor(
        matchedArtifact.requestInterceptors?.request,
        interceptorContextParams
      );
      await callWebSocketRequestInterceptor(matchedRoute.interceptors?.request, interceptorContextParams);

      const routeEvent = matchedRoute.event;
      let event =
        typeof routeEvent === 'function'
          ? await routeEvent(request as unknown as Request, (matchedRoute.entities ?? {}) as any, context)
          : routeEvent;

      const responseContextParams = {
        ...interceptorContextParams,
        setDelay: async (nextDelay: number) => {
          delay = nextDelay;
          await sleep(nextDelay);
        }
      };

      event = await callWebSocketResponseInterceptor(
        matchedRoute.interceptors?.response,
        event,
        responseContextParams
      );
      event = await callWebSocketResponseInterceptor(
        matchedArtifact.requestInterceptors?.response,
        event,
        responseContextParams
      );
      event = await callWebSocketResponseInterceptor(
        matchedArtifact.componentInterceptors?.response,
        event,
        responseContextParams
      );
      event = await callWebSocketResponseInterceptor(
        matchedArtifact.serverInterceptors?.response,
        event,
        responseContextParams
      );

      if (delay > 0) {
        await sleep(delay);
      }

      if (typeof event === 'undefined') return;
      if (typeof event === 'string') {
        socket.send(event);
        return;
      }

      socket.send(JSON.stringify(event));
    });
  });

  httpServer.on('close', () => {
    webSocketServer.clients.forEach((client: WebSocket) => {
      client.close();
    });
    webSocketServer.close();
  });
};

