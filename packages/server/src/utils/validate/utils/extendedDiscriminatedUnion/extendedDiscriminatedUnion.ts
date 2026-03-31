import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { getMostSpecificPathFromError } from '../../getMostSpecificPathFromError';

type ExtendedDiscriminatedUnionVariant<
  Discriminator extends string | symbol,
  Option extends z.ZodObject<{ [Key in Discriminator]: z.ZodTypeAny }> = z.ZodObject<{
    [Key in Discriminator]: z.ZodTypeAny;
  }>
> = Option | z.ZodDiscriminatedUnion<string, [Option, ...Option[]]>;

export const extendedDiscriminatedUnion = <Discriminator extends string | symbol>(
  discriminator: Discriminator,
  variants: [
    ExtendedDiscriminatedUnionVariant<Discriminator>,
    ...ExtendedDiscriminatedUnionVariant<Discriminator>[]
  ]
) => {
  // console.log(`extendedDiscriminatedUnion for discriminator=${String(discriminator)}`);
  return z
    .custom((value) => {
      // console.log('\n\ncheck value=', value);
      if (!isPlainObject(value)) {
        // console.log('value is !isPlainObject');
        return false;
      }
      if (typeof discriminator === 'string') {
        // console.log('discriminator is string');
        return discriminator in value;
      }
      // console.log(
      //   `discriminator(${String(discriminator)}) is symbol, value(${JSON.stringify(value)}), symbols=${Object.getOwnPropertySymbols(value).map((sym) => String(sym))},`,
      //   'value symbols includes discriminator=',
      //   Object.getOwnPropertySymbols(value).includes(discriminator)
      // );
      return Object.getOwnPropertySymbols(value).includes(discriminator);
    })
    .superRefine((value, context) => {
      const variantWithMatchedDiscriminator = variants.find((variant) => {
        const isVariantOption = variant instanceof z.ZodDiscriminatedUnion;
        if (isVariantOption) {
          return variant.options.some(
            (option) =>
              option
                .strip()
                .pick({[discriminator]: true} as any)
                .safeParse(value).success
          );
        }

        return variant
          .strip()
          .pick({[discriminator]: true} as any)
          .safeParse(value).success;
      });

      if (!variantWithMatchedDiscriminator) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [typeof discriminator === 'symbol' ? 'checkModeSymbol' : discriminator],
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
}


