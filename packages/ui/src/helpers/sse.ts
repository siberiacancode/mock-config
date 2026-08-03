export interface SseEvent {
  data: string;
  event?: string;
  id?: string;
}

const FIELD = /^(?<name>[^:]*):\s?(?<value>.*)$/;

const parseFrame = (frame: string): SseEvent | undefined => {
  const data: string[] = [];
  let event: string | undefined;
  let id: string | undefined;

  frame.split('\n').forEach((line) => {
    const match = FIELD.exec(line);
    if (!match?.groups) return;

    const { name, value } = match.groups;
    if (name === 'data') data.push(value);
    if (name === 'event') event = value;
    if (name === 'id') id = value;
  });

  if (!data.length && !event) return undefined;

  return { data: data.join('\n'), ...(event && { event }), ...(id && { id }) };
};

export const parseSseFrames = (buffer: string) => {
  const frames = buffer.split(/\r?\n\r?\n/);
  const rest = frames.pop() ?? '';

  return {
    events: frames.flatMap((frame) => {
      const event = parseFrame(frame);
      return event ? [event] : [];
    }),
    rest
  };
};
