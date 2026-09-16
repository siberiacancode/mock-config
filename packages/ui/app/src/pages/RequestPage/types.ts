export interface RouteEntry {
  data?: unknown;
  entities?: Record<string, unknown>;
  settings?: { delay?: number; status?: number };
}

export interface RouteMatcher {
  entity: string;
  key?: string;
  /** `equals` for literals, `matches` for opaque functions, comparator name otherwise. */
  operator: string;
  preview?: string;
  value: string;
}
