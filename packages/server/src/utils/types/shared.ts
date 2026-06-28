export type ApiType = 'graphql' | 'rest' | 'ws';

export type RestMethod = 'delete' | 'get' | 'options' | 'patch' | 'post' | 'put';

export type GraphQLOperationType = 'mutation' | 'query';
export type GraphQLTransportWsOperationType = 'subscription';

export type WsEvent = 'close' | 'error' | 'message' | 'open';
export type WsMessageType = 'graphql-ws' | 'raw';
