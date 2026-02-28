import { z } from 'zod';
type ExtendedDiscriminatedUnionVariant<Discriminator extends string, Option extends z.ZodObject<{
    [Key in Discriminator]: z.ZodTypeAny;
}> = z.ZodObject<{
    [Key in Discriminator]: z.ZodTypeAny;
}>> = Option | z.ZodDiscriminatedUnion<string, [Option, ...Option[]]>;
export declare const extendedDiscriminatedUnion: <Discriminator extends string>(discriminator: Discriminator, variants: [ExtendedDiscriminatedUnionVariant<Discriminator>, ...ExtendedDiscriminatedUnionVariant<Discriminator>[]]) => z.ZodEffects<z.ZodType<unknown, z.ZodTypeDef, unknown>, unknown, unknown>;
export {};
