import type { Buffer } from 'node:buffer';
import type { RawData } from 'ws';

import type { WsFrame } from '@/utils/types';

const parseWsFrameData = (text: string) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export const createWsFrame = (raw: RawData, isBinary: boolean): WsFrame => {
  if (isBinary) {
    const binaryRaw = raw as Buffer;
    return {
      data: parseWsFrameData(binaryRaw.toString('utf-8')),
      isBinary: true,
      raw: binaryRaw
    };
  }

  const textRaw = raw.toString();
  return {
    data: parseWsFrameData(textRaw),
    isBinary: false,
    raw: textRaw
  };
};
