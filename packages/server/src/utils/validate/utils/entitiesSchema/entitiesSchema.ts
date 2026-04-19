import { z } from 'zod';

import type { Comparator } from '@/utils/types';

import { isComparator } from '@/utils/helpers';

export const mappedEntitySchema = z.union([
  z.custom<Comparator>(isComparator),
  z.record(
    z.string(),
    z.union([
      z.boolean(),
      z.number(),
      z.string(),
      z.custom<Comparator>(isComparator),
      z.array(z.union([z.boolean(), z.number(), z.string()]))
    ])
  )
]);

export const bodyEntitySchema = z.union([
  z.custom<Comparator>(isComparator),
  z.string(),
  z.record(z.string(), z.unknown()),
  z.array(z.unknown())
]);

export const variablesEntitySchema = z.union([
  z.custom<Comparator>(isComparator),
  z.record(
    z.string(),
    z.union([z.boolean(), z.number(), z.string(), z.custom<Comparator>(isComparator)])
  )
]);
