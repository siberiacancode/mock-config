import { z } from 'zod';
import type { RestMethod } from '../../../types';
export declare const routeConfigSchema: (method: RestMethod) => z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
    settings: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
    data: z.ZodUnion<[z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>, z.ZodAny]>;
} & {
    entities: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
    interceptors: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
}, "strict", z.ZodTypeAny, {
    data?: any;
    interceptors?: any;
    entities?: any;
    settings?: any;
}, {
    data?: any;
    interceptors?: unknown;
    entities?: unknown;
    settings?: unknown;
}>>, z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
    settings: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
    file: z.ZodString;
} & {
    entities: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
    interceptors: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
}, "strict", z.ZodTypeAny, {
    file: string;
    interceptors?: any;
    entities?: any;
    settings?: any;
}, {
    file: string;
    interceptors?: unknown;
    entities?: unknown;
    settings?: unknown;
}>>, z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
    settings: z.ZodObject<{
        status: z.ZodOptional<z.ZodNumber>;
        delay: z.ZodOptional<z.ZodNumber>;
    } & {
        polling: z.ZodLiteral<true>;
    }, "strict", z.ZodTypeAny, {
        polling: true;
        status?: number | undefined;
        delay?: number | undefined;
    }, {
        polling: true;
        status?: number | undefined;
        delay?: number | undefined;
    }>;
    queue: z.ZodArray<z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
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
} & {
    entities: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
    interceptors: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
}, "strict", z.ZodTypeAny, {
    queue: ({
        data?: any;
        time?: number | undefined;
    } | {
        file: string;
        time?: number | undefined;
    })[];
    settings: {
        polling: true;
        status?: number | undefined;
        delay?: number | undefined;
    };
    interceptors?: any;
    entities?: any;
}, {
    queue: unknown[];
    settings: {
        polling: true;
        status?: number | undefined;
        delay?: number | undefined;
    };
    interceptors?: unknown;
    entities?: unknown;
}>>]>;
