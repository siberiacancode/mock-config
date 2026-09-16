import type { StreamLine, StreamResult } from '../types';

const NDJSON_TYPE = 'application/x-ndjson';

export const isStreamResponse = (response: Response) =>
  (response.headers.get('content-type') ?? '').includes(NDJSON_TYPE);

export const EMPTY_STREAM: StreamResult = { events: [], isActive: true };

export const splitStreamLines = (buffer: string) => {
  const lines = buffer.split('\n');
  return { lines, rest: lines.pop() ?? '' };
};

export const parseStreamLine = (line: string): StreamLine | undefined => {
  if (!line.trim()) return undefined;

  try {
    const parsed = JSON.parse(line);
    return typeof parsed?.kind === 'string' ? (parsed as StreamLine) : undefined;
  } catch {
    return undefined;
  }
};

export const applyStreamLine = (
  stream: StreamResult,
  line: StreamLine,
  elapsedMs: number
): StreamResult => {
  if (line.kind === 'meta')
    return {
      ...stream,
      meta: {
        status: line.status,
        statusText: line.statusText,
        durationMs: line.durationMs,
        headers: line.headers
      }
    };

  if (line.kind === 'event')
    return {
      ...stream,
      events: [
        ...stream.events,
        { atMs: line.atMs, data: line.data, event: line.event, id: line.id }
      ]
    };

  if (line.kind === 'error')
    return { ...stream, isActive: false, error: line.error, totalMs: elapsedMs };

  return { ...stream, isActive: false, totalMs: elapsedMs };
};

export const formatEventData = (data: string) => {
  try {
    return JSON.stringify(JSON.parse(data));
  } catch {
    return data;
  }
};
