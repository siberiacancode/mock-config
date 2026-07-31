import type { Primitive } from '@/utils/types';

export const isPrimitive = (value: any): value is Primitive => value !== Object(value);
