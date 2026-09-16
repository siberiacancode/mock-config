import type { SendResult } from '../types';

import {
  applyStreamLine,
  EMPTY_STREAM,
  isStreamResponse,
  parseStreamLine,
  splitStreamLines
} from './stream';

type Publish = (result: SendResult) => void;

interface ResponseReader {
  matches: (response: Response) => boolean;
  read: (response: Response, publish: Publish, startedAt: number) => Promise<void>;
}

const streamReader: ResponseReader = {
  matches: isStreamResponse,
  read: async (response, publish, startedAt) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    const elapsedMs = () => Math.round(performance.now() - startedAt);
    let stream = EMPTY_STREAM;
    let buffer = '';

    publish({ stream });

    const applyChunk = (chunk: string) => {
      const { lines, rest } = splitStreamLines(buffer + chunk);
      buffer = rest;

      lines.forEach((line) => {
        const parsed = parseStreamLine(line);
        if (!parsed) return;

        stream = applyStreamLine(stream, parsed, elapsedMs());
        publish({ stream });
      });
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        applyChunk(decoder.decode(value, { stream: true }));
      }
    } finally {
      applyChunk(decoder.decode());

      if (stream.isActive) {
        stream = { ...stream, isActive: false, totalMs: elapsedMs() };
        publish({ stream });
      }
    }
  }
};

const jsonReader: ResponseReader = {
  matches: () => true,
  read: async (response, publish) => {
    const data = await response.json();
    publish('error' in data ? { error: String(data.error) } : { response: data });
  }
};

const RESPONSE_READERS: ResponseReader[] = [streamReader, jsonReader];

export const getResponseReader = (response: Response) =>
  RESPONSE_READERS.find((reader) => reader.matches(response)) ?? jsonReader;
