"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "extendedDiscriminatedUnion", {
    enumerable: true,
    get: function() {
        return extendedDiscriminatedUnion;
    }
});
const _zod = require("zod");
const _helpers = require("../../../helpers");
const _getMostSpecificPathFromError = require("../../getMostSpecificPathFromError");
const extendedDiscriminatedUnion = (discriminator, variants)=>_zod.z.custom((value)=>(0, _helpers.isPlainObject)(value) && discriminator in value).superRefine((value, context)=>{
        const variantWithMatchedDiscriminator = variants.find((variant)=>{
            const isVariantOption = variant instanceof _zod.z.ZodDiscriminatedUnion;
            if (isVariantOption) {
                return variant.options.some((option)=>option.strip().pick({
                        [discriminator]: true
                    }).safeParse(value).success);
            }
            return variant.strip().pick({
                [discriminator]: true
            }).safeParse(value).success;
        });
        if (!variantWithMatchedDiscriminator) {
            context.addIssue({
                code: _zod.z.ZodIssueCode.custom,
                path: [
                    discriminator
                ],
                fatal: true
            });
            return _zod.z.NEVER;
        }
        const valueParseResult = variantWithMatchedDiscriminator.safeParse(value);
        if (!valueParseResult.success) {
            const issuePath = (0, _getMostSpecificPathFromError.getMostSpecificPathFromError)(valueParseResult.error);
            context.addIssue({
                code: _zod.z.ZodIssueCode.custom,
                path: issuePath,
                fatal: true
            });
            return _zod.z.NEVER;
        }
    });
