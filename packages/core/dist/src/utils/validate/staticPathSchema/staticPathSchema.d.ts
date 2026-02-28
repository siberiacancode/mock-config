import { z } from 'zod';
export declare const staticPathSchema: z.ZodUnion<[z.ZodUnion<[z.ZodString, z.ZodObject<{
    prefix: z.ZodString;
    path: z.ZodString;
}, "strict", z.ZodTypeAny, {
    path: string;
    prefix: string;
}, {
    path: string;
    prefix: string;
}>]>, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
    prefix: z.ZodString;
    path: z.ZodString;
}, "strict", z.ZodTypeAny, {
    path: string;
    prefix: string;
}, {
    path: string;
    prefix: string;
}>]>, "many">]>;
