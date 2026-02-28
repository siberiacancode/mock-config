import { z } from 'zod';
export declare const checkActualValueCheckModeSchema: z.ZodEnum<["exists", "notExists"]>;
export declare const compareWithDescriptorAnyValueCheckModeSchema: z.ZodEnum<["equals", "notEquals"]>;
export declare const compareWithDescriptorStringValueCheckModeSchema: z.ZodEnum<["includes", "notIncludes", "startsWith", "notStartsWith", "endsWith", "notEndsWith"]>;
export declare const compareWithDescriptorValueCheckModeSchema: z.ZodEnum<["equals", "notEquals", "includes", "notIncludes", "startsWith", "notStartsWith", "endsWith", "notEndsWith"]>;
export interface EntityDescriptorSchema {
    (checkModeSchema: typeof checkActualValueCheckModeSchema): z.ZodObject<{
        checkMode: typeof checkModeSchema;
    }, 'strict'>;
    (checkModeSchema: z.ZodLiteral<'function'> | z.ZodLiteral<'regExp'> | typeof compareWithDescriptorAnyValueCheckModeSchema | typeof compareWithDescriptorStringValueCheckModeSchema | typeof compareWithDescriptorValueCheckModeSchema, valueSchema: z.ZodTypeAny): z.ZodDiscriminatedUnion<'oneOf', [
        z.ZodObject<{
            checkMode: typeof checkModeSchema;
            oneOf: z.ZodLiteral<true>;
            value: z.ZodArray<typeof valueSchema>;
        }, 'strict'>,
        z.ZodObject<{
            checkMode: typeof checkModeSchema;
            oneOf: z.ZodOptional<z.ZodLiteral<false>>;
            value: typeof valueSchema;
        }, 'strict'>
    ]>;
}
export declare const entityDescriptorSchema: EntityDescriptorSchema;
