import { z } from 'zod';
export declare const corsSchema: z.ZodObject<{
    origin: z.ZodUnion<[z.ZodUnion<[z.ZodString, z.ZodType<RegExp, z.ZodTypeDef, RegExp>]>, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodType<RegExp, z.ZodTypeDef, RegExp>]>, "many">, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>;
    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]>, "many">>;
    allowedHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    exposedHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    credentials: z.ZodOptional<z.ZodBoolean>;
    maxAge: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    origin: string | RegExp | (string | RegExp)[] | ((...args: unknown[]) => unknown);
    methods?: ("DELETE" | "GET" | "OPTIONS" | "PATCH" | "POST" | "PUT")[] | undefined;
    allowedHeaders?: string[] | undefined;
    exposedHeaders?: string[] | undefined;
    credentials?: boolean | undefined;
    maxAge?: number | undefined;
}, {
    origin: string | RegExp | (string | RegExp)[] | ((...args: unknown[]) => unknown);
    methods?: ("DELETE" | "GET" | "OPTIONS" | "PATCH" | "POST" | "PUT")[] | undefined;
    allowedHeaders?: string[] | undefined;
    exposedHeaders?: string[] | undefined;
    credentials?: boolean | undefined;
    maxAge?: number | undefined;
}>;
