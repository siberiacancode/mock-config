/** What the drawer replays: a rest route by method and path, a graphql operation by identifier. */
export type SendTarget =
  | { identifier: string; operationType: 'mutation' | 'query'; type: 'graphql' }
  | { method: string; path: string; type: 'rest' };

export interface GraphqlDocument {
  /** Query text sent as is; prefilled from the identifier and editable. */
  query: string;
  /** Variables text; prefilled from the `variables` matcher and editable. */
  variables: string;
}

export interface EntityRow {
  /** Human readable comparator label, when the row comes from a comparator. */
  comparator?: string;
  /** Set when the value could not be inferred and has to be typed by hand. */
  input?: RowInput;
  key: string;
  /** Value actually sent; `undefined` means the field is omitted from the request. */
  send?: string;
  value: string;
  /** Set when no value satisfying the comparator could be inferred. */
  warning?: string;
}

export interface ProxyResponse {
  body: string;
  durationMs: number;
  headers: Record<string, string>;
  status: number;
  statusText: string;
}

/** A row with the current manual input applied. */
export interface ResolvedRow extends EntityRow {
  /** Current manual input; always empty for rows without `input`. */
  draft: string;
  /** `true` when a manual value is present but does not satisfy the condition. */
  invalid: boolean;
  /** Line for the warning banner; `undefined` when the row is satisfied. */
  issue?: string;
}

export interface RowInput {
  /** Readable condition shown under the field, e.g. `must match /^[A-Z][a-z]+$/`. */
  condition: string;
  /** Absent when the value cannot be checked automatically. */
  validate?: (value: string) => boolean;
}

export interface SendResult {
  error?: string;
  response?: ProxyResponse;
  stream?: StreamResult;
}

/** Everything the inspector proxy needs to replay a route. */
export interface RequestPayload {
  body?: string;
  headers: Record<string, string>;
  method: string;
  path: string;
}

/** One line of the `application/x-ndjson` stream the inspector answers with for streaming routes. */
export type StreamLine =
  | { atMs: number; data: string; event?: string; id?: string; kind: 'event' }
  | {
      durationMs: number;
      headers: Record<string, string>;
      kind: 'meta';
      status: number;
      statusText: string;
    }
  | { error: string; kind: 'error' }
  | { kind: 'end' };

export interface StreamEvent {
  /** Milliseconds between the start of the request and the arrival of the event. */
  atMs: number;
  data: string;
  event?: string;
  id?: string;
}

export interface StreamResult {
  error?: string;
  events: StreamEvent[];
  /** `true` while the connection is open. */
  isActive: boolean;
  meta?: {
    durationMs: number;
    headers: Record<string, string>;
    status: number;
    statusText: string;
  };
  /** Set once the stream closed — how long the connection lived. */
  totalMs?: number;
}
