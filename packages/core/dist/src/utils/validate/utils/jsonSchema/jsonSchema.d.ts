import { z } from 'zod';
export declare const jsonLiteralSchema: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
type JsonLiteral = z.infer<typeof jsonLiteralSchema>;
type Json = Json[] | JsonLiteral | {
    [key: string]: Json;
};
export declare const jsonSchema: z.ZodType<Json>;
export {};
