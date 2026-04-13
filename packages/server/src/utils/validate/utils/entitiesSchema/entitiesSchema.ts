import { z } from 'zod';

export const mappedEntitySchema = z.union([z.function(), z.record(z.string(), z.unknown())]);
export const bodyEntitySchema = z.union([z.function(), z.unknown()]);
export const variablesEntitySchema = z.union([z.function(), z.record(z.string(), z.unknown())]);
