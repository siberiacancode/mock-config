import { z } from 'zod';
export declare const interceptorsSchema: z.ZodObject<{
    request: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    response: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
}, "strict", z.ZodTypeAny, {
    request?: ((...args: unknown[]) => unknown) | undefined;
    response?: ((...args: unknown[]) => unknown) | undefined;
}, {
    request?: ((...args: unknown[]) => unknown) | undefined;
    response?: ((...args: unknown[]) => unknown) | undefined;
}>;
