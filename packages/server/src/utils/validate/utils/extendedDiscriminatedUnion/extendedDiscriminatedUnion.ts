import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { getMostSpecificPathFromError } from '../../getMostSpecificPathFromError';

type ExtendedDiscriminatedUnionVariant<
  Discriminator extends string,
  Option extends z.ZodObject<{ [Key in Discriminator]: z.ZodTypeAny }> = z.ZodObject<{
    [Key in Discriminator]: z.ZodTypeAny;
  }>
> = Option | z.ZodDiscriminatedUnion<string, [Option, ...Option[]]>;

export const extendedDiscriminatedUnion = <Discriminator extends string>(
  discriminator: Discriminator,
  variants: [
    ExtendedDiscriminatedUnionVariant<Discriminator>,
    ...ExtendedDiscriminatedUnionVariant<Discriminator>[]
  ]
) =>
  z
    .custom((value) => isPlainObject(value) && discriminator in value)
    .superRefine((value, context) => {
      const variantWithMatchedDiscriminator = variants.find((variant) => {
        const isVariantOption = variant instanceof z.ZodDiscriminatedUnion;
        if (isVariantOption) {
          return variant.options.some(
            (option) =>
              option
                .strip()
                .pick({ [discriminator]: true } as any)
                .safeParse(value).success
          );
        }

        return variant
          .strip()
          .pick({ [discriminator]: true } as any)
          .safeParse(value).success;
      });

      if (!variantWithMatchedDiscriminator) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [discriminator],
          fatal: true
        });
        return z.NEVER;
      }

      const valueParseResult = variantWithMatchedDiscriminator.safeParse(value);
      if (!valueParseResult.success) {
        const issuePath = getMostSpecificPathFromError(valueParseResult.error);
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: issuePath,
          fatal: true
        });
        return z.NEVER;
      }
    });
