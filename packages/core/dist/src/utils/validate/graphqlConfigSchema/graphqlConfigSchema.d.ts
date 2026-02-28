import { z } from 'zod';
export declare const graphqlRequestConfigSchema: z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
    operationName: z.ZodUnion<[z.ZodString, z.ZodType<RegExp, z.ZodTypeDef, RegExp>]>;
    query: z.ZodOptional<z.ZodString>;
} & {
    operationType: z.ZodEnum<["query", "mutation"]>;
    routes: z.ZodArray<z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
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
    }>>]>, "many">;
    interceptors: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
}, "strict", z.ZodTypeAny, {
    routes: ({
        data?: any;
        interceptors?: any;
        entities?: any;
        settings?: any;
    } | {
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
    })[];
    operationName: string | RegExp;
    operationType: "query" | "mutation";
    query?: string | undefined;
    interceptors?: any;
}, {
    routes: unknown[];
    operationName: string | RegExp;
    operationType: "query" | "mutation";
    query?: string | undefined;
    interceptors?: unknown;
}>>, z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
    operationName: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodType<RegExp, z.ZodTypeDef, RegExp>]>>;
    query: z.ZodString;
} & {
    operationType: z.ZodEnum<["query", "mutation"]>;
    routes: z.ZodArray<z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
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
    }>>]>, "many">;
    interceptors: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
}, "strict", z.ZodTypeAny, {
    query: string;
    routes: ({
        data?: any;
        interceptors?: any;
        entities?: any;
        settings?: any;
    } | {
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
    })[];
    operationType: "query" | "mutation";
    interceptors?: any;
    operationName?: string | RegExp | undefined;
}, {
    query: string;
    routes: unknown[];
    operationType: "query" | "mutation";
    interceptors?: unknown;
    operationName?: string | RegExp | undefined;
}>>]>;
export declare const graphqlConfigSchema: z.ZodObject<{
    baseUrl: z.ZodOptional<z.ZodString>;
    configs: z.ZodArray<z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
        operationName: z.ZodUnion<[z.ZodString, z.ZodType<RegExp, z.ZodTypeDef, RegExp>]>;
        query: z.ZodOptional<z.ZodString>;
    } & {
        operationType: z.ZodEnum<["query", "mutation"]>;
        routes: z.ZodArray<z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
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
        }>>]>, "many">;
        interceptors: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
    }, "strict", z.ZodTypeAny, {
        routes: ({
            data?: any;
            interceptors?: any;
            entities?: any;
            settings?: any;
        } | {
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
        })[];
        operationName: string | RegExp;
        operationType: "query" | "mutation";
        query?: string | undefined;
        interceptors?: any;
    }, {
        routes: unknown[];
        operationName: string | RegExp;
        operationType: "query" | "mutation";
        query?: string | undefined;
        interceptors?: unknown;
    }>>, z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
        operationName: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodType<RegExp, z.ZodTypeDef, RegExp>]>>;
        query: z.ZodString;
    } & {
        operationType: z.ZodEnum<["query", "mutation"]>;
        routes: z.ZodArray<z.ZodUnion<[z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodObject<{
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
        }>>]>, "many">;
        interceptors: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
    }, "strict", z.ZodTypeAny, {
        query: string;
        routes: ({
            data?: any;
            interceptors?: any;
            entities?: any;
            settings?: any;
        } | {
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
        })[];
        operationType: "query" | "mutation";
        interceptors?: any;
        operationName?: string | RegExp | undefined;
    }, {
        query: string;
        routes: unknown[];
        operationType: "query" | "mutation";
        interceptors?: unknown;
        operationName?: string | RegExp | undefined;
    }>>]>, "many">;
    interceptors: z.ZodOptional<z.ZodPipeline<z.ZodType<unknown, z.ZodTypeDef, unknown>, z.ZodTypeAny>>;
}, "strict", z.ZodTypeAny, {
    configs: ({
        routes: ({
            data?: any;
            interceptors?: any;
            entities?: any;
            settings?: any;
        } | {
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
        })[];
        operationName: string | RegExp;
        operationType: "query" | "mutation";
        query?: string | undefined;
        interceptors?: any;
    } | {
        query: string;
        routes: ({
            data?: any;
            interceptors?: any;
            entities?: any;
            settings?: any;
        } | {
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
        })[];
        operationType: "query" | "mutation";
        interceptors?: any;
        operationName?: string | RegExp | undefined;
    })[];
    interceptors?: any;
    baseUrl?: string | undefined;
}, {
    configs: unknown[];
    interceptors?: unknown;
    baseUrl?: string | undefined;
}>;
