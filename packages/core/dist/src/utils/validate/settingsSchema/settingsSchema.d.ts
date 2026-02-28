import { z } from 'zod';
export declare const settingsSchema: z.ZodObject<{
    polling: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodNumber>;
    delay: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    status?: number | undefined;
    polling?: boolean | undefined;
    delay?: number | undefined;
}, {
    status?: number | undefined;
    polling?: boolean | undefined;
    delay?: number | undefined;
}>;
