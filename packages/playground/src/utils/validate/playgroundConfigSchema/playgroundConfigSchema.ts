import { z } from 'zod';

/** Validates JSON database payload (top-level object). */
export const playgroundDataSchema = z.record(z.string(), z.any());
