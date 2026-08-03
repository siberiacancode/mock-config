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
}

/** Everything the inspector proxy needs to replay a route. */
export interface RequestPayload {
  body?: string;
  headers: Record<string, string>;
  method: string;
  path: string;
}
