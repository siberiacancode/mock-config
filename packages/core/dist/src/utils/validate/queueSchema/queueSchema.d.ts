import { z } from 'zod';
export declare const queueSchema: z.ZodArray<z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
    time: z.ZodOptional<z.ZodNumber>;
    data: z.ZodUnion<[z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>, z.ZodAny]>;
}, "strict", z.ZodTypeAny, {
    data?: any;
    time?: number | undefined;
}, {
    data?: any;
    time?: number | undefined;
}>>, z.ZodObject<{
    time: z.ZodOptional<z.ZodNumber>;
    file: z.ZodString;
}, "strict", z.ZodTypeAny, {
    file: string;
    time?: number | undefined;
}, {
    file: string;
    time?: number | undefined;
}>]>, "many">;
