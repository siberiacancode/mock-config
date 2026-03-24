import { flatten } from "flat";
import type { IncomingMessage, Server } from "node:http";
import type { RawData, WebSocket } from "ws";
import { WebSocketServer } from "ws";

import type {
  EntityDescriptor,
  Entries,
  MessagePlainEntity,
  PlainObject,
  TopLevelPlainEntityArray,
  TopLevelPlainEntityDescriptor,
  WebSocketDataResponse,
  WebSocketRequestArtifact,
} from "@/utils/types";

import { parseCookie } from "@/core/middlewares/cookieParseMiddleware/helpers/parseCookie/parseCookie";
import {
  callResponseInterceptors,
  convertToEntityDescriptor,
  isEntityDescriptor,
  isPlainObject,
  resolveEntityValues,
  sleep,
} from "@/utils/helpers";

interface CreateWebSocketRouteParams {
  httpServer: Server;
  webSocketRequestArtifacts: WebSocketRequestArtifact[];
}

interface ParsedSocketMessage {
  raw: string;
  parsed?: PlainObject;
  event?: string;
}

interface WebSocketRouteContext {
  connectionId: string;
  socket: WebSocket;
  request: IncomingMessage;
  event?: string;
  message: {
    raw: string;
    parsed?: PlainObject;
  };
}

const parseIncomingSocketMessage = (value: RawData): ParsedSocketMessage => {
  const raw = Array.isArray(value)
    ? Buffer.concat(value).toString("utf-8")
    : Buffer.isBuffer(value)
    ? value.toString("utf-8")
    : String(value);

  try {
    const parsed = JSON.parse(raw);

    if (isPlainObject(parsed)) {
      return {
        raw,
        parsed,
        event: typeof parsed.event === "string" ? parsed.event : undefined,
      };
    }
  } catch {
    // noop
  }

  return {
    raw,
    parsed: undefined,
    event: undefined,
  };
};

const isPathMatchedByBaseUrl = (path: string, baseUrl: string) => {
  if (baseUrl === "/") return true;
  return path === baseUrl || path.startsWith(`${baseUrl}/`);
};

const isMappedEntityMatched = (
  descriptor: Record<string, unknown>,
  actualValue: Record<string, unknown>
) => {
  const flattenedActualValue = flatten<
    Record<string, unknown>,
    Record<string, unknown>
  >(actualValue);

  return Object.entries(descriptor).every(
    ([entityPropertyKey, entityPropertyDescriptorOrValue]) => {
      const entityPropertyDescriptor = convertToEntityDescriptor(
        entityPropertyDescriptorOrValue
      );
      const actualPropertyKey = entityPropertyKey.toLowerCase();
      const actualPropertyValue = flattenedActualValue[actualPropertyKey];

      if (
        entityPropertyDescriptor.checkMode === "exists" ||
        entityPropertyDescriptor.checkMode === "notExists"
      ) {
        return resolveEntityValues({
          actualValue: actualPropertyValue,
          checkMode: entityPropertyDescriptor.checkMode,
        });
      }

      return resolveEntityValues({
        actualValue: actualPropertyValue,
        descriptorValue: entityPropertyDescriptor.value,
        checkMode: entityPropertyDescriptor.checkMode,
        oneOf: entityPropertyDescriptor.oneOf ?? false,
      });
    }
  );
};

const isMessageEntityMatched = (
  entityDescriptorOrValue:
    | MessagePlainEntity
    | TopLevelPlainEntityDescriptor
    | TopLevelPlainEntityArray,
  messageValue: unknown
) => {
  const isTopLevelDescriptor = isEntityDescriptor(entityDescriptorOrValue);

  if (isTopLevelDescriptor) {
    const descriptor = entityDescriptorOrValue as EntityDescriptor;

    if (
      descriptor.checkMode === "exists" ||
      descriptor.checkMode === "notExists"
    ) {
      return resolveEntityValues({
        actualValue: messageValue,
        checkMode: descriptor.checkMode,
      });
    }

    return resolveEntityValues({
      actualValue: messageValue,
      descriptorValue: descriptor.value,
      checkMode: descriptor.checkMode,
      oneOf: descriptor.oneOf ?? false,
    });
  }

  const isTopLevelArray = Array.isArray(entityDescriptorOrValue);

  if (isTopLevelArray) {
    if (!Array.isArray(messageValue)) return false;

    return resolveEntityValues({
      actualValue: messageValue,
      descriptorValue: entityDescriptorOrValue,
      checkMode: "equals",
    });
  }

  if (!isPlainObject(messageValue)) return false;

  return isMappedEntityMatched(
    entityDescriptorOrValue as Record<string, unknown>,
    messageValue as Record<string, unknown>
  );
};

export const createWebSocketRoute = ({
  httpServer,
  webSocketRequestArtifacts,
}: CreateWebSocketRouteParams) => {
  if (!webSocketRequestArtifacts.length) return;

  const webSocketServer = new WebSocketServer({ noServer: true });
  let connectionId = 0;

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`
    );
    const requestPath = url.pathname;

    const isWebSocketPathMatched = webSocketRequestArtifacts.some((artifact) =>
      isPathMatchedByBaseUrl(requestPath, artifact.baseUrl)
    );

    if (!isWebSocketPathMatched) {
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit("connection", webSocket, request);
    });
  });

  webSocketServer.on("connection", (socket, request) => {
    connectionId += 1;

    const currentConnectionId = String(connectionId);
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`
    );
    const requestPath = url.pathname;
    const query = Object.fromEntries(url.searchParams.entries());
    const cookies = parseCookie(request.headers.cookie ?? "");
    const headers = request.headers as Record<string, unknown>;

    socket.on("message", async (rawMessage) => {
      const parsedMessage = parseIncomingSocketMessage(rawMessage);

      const matchedRequestArtifacts = webSocketRequestArtifacts.filter(
        (artifact) => {
          const isBaseUrlMatched = isPathMatchedByBaseUrl(
            requestPath,
            artifact.baseUrl
          );
          if (!isBaseUrlMatched) return false;

          const actualEvent = parsedMessage.event ?? parsedMessage.raw;

          if (artifact.event instanceof RegExp) {
            return artifact.event.test(actualEvent);
          }

          return artifact.event === actualEvent;
        }
      );

      if (!matchedRequestArtifacts.length) return;

      const matchedRouteConfig = matchedRequestArtifacts.find(({ config }) => {
        if (!config.entities) return true;

        const entityEntries = Object.entries(config.entities) as Entries<
          typeof config.entities
        >;

        return entityEntries.every(([entityName, entityDescriptorOrValue]) => {
          if (!entityDescriptorOrValue) return true;

          if (entityName === "headers") {
            return isMappedEntityMatched(
              entityDescriptorOrValue as Record<string, unknown>,
              headers
            );
          }

          if (entityName === "cookies") {
            return isMappedEntityMatched(
              entityDescriptorOrValue as Record<string, unknown>,
              cookies
            );
          }

          if (entityName === "query") {
            return isMappedEntityMatched(
              entityDescriptorOrValue as Record<string, unknown>,
              query
            );
          }

          if (entityName === "message") {
            return isMessageEntityMatched(
              entityDescriptorOrValue as MessagePlainEntity,
              parsedMessage.parsed ?? { raw: parsedMessage.raw }
            );
          }

          return true;
        });
      });

      if (!matchedRouteConfig) return;

      const context: WebSocketRouteContext = {
        connectionId: currentConnectionId,
        socket,
        request,
        event: parsedMessage.event,
        message: {
          raw: parsedMessage.raw,
          parsed: parsedMessage.parsed,
        },
      };

      if (matchedRouteConfig.serverRequestInterceptor) {
        await callWebSocketRequestInterceptor({
          interceptor: matchedRouteConfig.serverRequestInterceptor,
          context,
        });
      }

      if (matchedRouteConfig.componentRequestInterceptor) {
        await callWebSocketRequestInterceptor({
          interceptor: matchedRouteConfig.componentRequestInterceptor,
          context,
        });
      }

      if (matchedRouteConfig.requestRequestInterceptor) {
        await callWebSocketRequestInterceptor({
          interceptor: matchedRouteConfig.requestRequestInterceptor,
          context,
        });
      }

      if (matchedRouteConfig.routeRequestInterceptor) {
        await callWebSocketRequestInterceptor({
          interceptor: matchedRouteConfig.routeRequestInterceptor,
          context,
        });
      }

      let delay = matchedRouteConfig.config.settings?.delay ?? 0;

      let resolvedData: WebSocketDataResponse | undefined =
        typeof matchedRouteConfig.config.data === "function"
          ? await matchedRouteConfig.config.data(
              context,
              matchedRouteConfig.config.entities ?? {}
            )
          : matchedRouteConfig.config.data;

      resolvedData = await callResponseInterceptors({
        data: resolvedData,
        request: context.request,
        response: context.socket,
        interceptors: {
          routeInterceptor: matchedRouteConfig.routeResponseInterceptor,
          requestInterceptor: matchedRouteConfig.requestResponseInterceptor,
          componentInterceptor: matchedRouteConfig.componentResponseInterceptor,
          serverInterceptor: matchedRouteConfig.serverResponseInterceptor,
        },
      });

      if (delay) {
        await sleep(delay);
      }

      if (typeof resolvedData === "undefined") return;

      if (typeof resolvedData === "string") {
        socket.send(resolvedData);
        return;
      }

      socket.send(JSON.stringify(resolvedData));
    });
  });

  httpServer.on("close", () => {
    webSocketServer.clients.forEach((client) => {
      client.close();
    });

    webSocketServer.close();
  });
};
