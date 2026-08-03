export interface RouteEntry {
  data?: unknown;
  entities?: Record<string, unknown>;
  interceptors?: { request?: unknown; response?: unknown };
  settings?: { delay?: number; status?: number };
}

export interface InterceptorEntry {
  code: string;
  level: string;
  type: 'request' | 'response';
}

export interface RouteMatcher {
  entity: string;
  key?: string;
  /** `equals` for literals, `matches` for opaque functions, comparator name otherwise. */
  operator: string;
  preview?: string;
  value: string;
}
