import z from 'zod';

const sseMetaSchema = z
  .object({
    event: z.string().optional(),
    id: z.string().optional(),
    retry: z.number().int().nonnegative().optional()
  })
  .optional();

// ✅ important:
// SSE is a line-based protocol. `id` and `event` must be single-line values.
// Strip CR/LF so metadata cannot break frame structure.
const normalizeSseMetaValue = (value: string) => value.replaceAll('\r', '').replaceAll('\n', '');

export const formatSsePayload = (
  data: string,
  meta?: { event?: string; id?: string; retry?: number }
) => {
  const parseMetaResult = sseMetaSchema.safeParse(meta);
  if (!parseMetaResult.success) {
    throw new Error(`Invalid SSE meta: ${parseMetaResult.error.issues[0]?.message}`);
  }

  const parsedMeta = parseMetaResult.data;
  const lines: string[] = [];

  if (parsedMeta?.id) {
    lines.push(`id: ${normalizeSseMetaValue(parsedMeta.id)}`);
  }

  if (parsedMeta?.event) {
    lines.push(`event: ${normalizeSseMetaValue(parsedMeta.event)}`);
  }

  if (parsedMeta?.retry) {
    lines.push(`retry: ${parsedMeta.retry}`);
  }

  // ✅ important:
  // Multiline payloads are encoded as multiple `data:` lines.
  // SSE clients concatenate consecutive `data:` lines with '\n' into one message.
  data.split(/\r\n|\r|\n/).forEach((line) => {
    lines.push(`data: ${line}`);
  });

  return `${lines.join('\n')}\n\n`;
};
