import { z } from 'zod';
import type { PlainObject } from '../../../types';
export declare const requiredPropertiesSchema: <T extends PlainObject>(schema: z.ZodType<T>, requiredProperties: (keyof T)[]) => z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodType<T, z.ZodTypeDef, T>>;
