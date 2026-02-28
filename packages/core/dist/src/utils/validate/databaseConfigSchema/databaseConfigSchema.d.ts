import { z } from 'zod';
export declare const databaseConfigSchema: z.ZodObject<{
    data: z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>, z.ZodString]>;
    routes: z.ZodOptional<z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>, z.ZodString]>>;
}, "strict", z.ZodTypeAny, {
    data?: any;
    routes?: any;
}, {
    data?: unknown;
    routes?: unknown;
}>;
