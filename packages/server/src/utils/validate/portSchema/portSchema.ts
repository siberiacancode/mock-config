import { z } from 'zod';

const MAX_PORT = 65535;
export const portSchema = z.number().int().nonnegative().max(MAX_PORT);
