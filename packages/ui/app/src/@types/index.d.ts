type Wrapper<T> = T extends (...args: any[]) => any
  ? string
  : T extends object
    ? { [K in keyof T]: Wrapper<T[K]> }
    : T;

type MockServerConfig = Wrapper<import('mock-config-server').MockServerConfig>;
type MockServerSettings = Wrapper<import('mock-config-server').MockServerSettings>;
type MockServerComponent = Wrapper<import('mock-config-server').MockServerComponent>;

interface Payload {
  config: MockServerConfig;
  ws: {
    port: number;
    lastUpdated: number;
  };
}

interface WebSocketMessage {
  payload: Payload;
  type: 'config-updated';
}

interface ApiStatus {
  mockServer: boolean;
  port: number;
}
