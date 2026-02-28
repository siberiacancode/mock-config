import { z } from 'zod';
import type { NestedObjectOrArray } from '../../../types';
export declare const nestedObjectOrArraySchema: <Value>(valueSchema: z.ZodType<Value>) => z.ZodType<NestedObjectOrArray<Value>>;
