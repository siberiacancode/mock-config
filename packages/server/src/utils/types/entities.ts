import type { Buffer } from 'node:buffer';

import type { COMPARATOR_META_SYMBOL, IS_COMPARATOR_SYMBOL } from '@/utils/constants';

export interface ComparatorMeta {
  args: unknown[];
  name: string;
}

export type Comparator<Actual = unknown, Expected = unknown> = ((
  actual: Actual,
  expected: Expected
) => boolean) & {
  [COMPARATOR_META_SYMBOL]?: ComparatorMeta;
  [IS_COMPARATOR_SYMBOL]: true;
};

type MappedEntityValue = boolean | number | string | (boolean | number | string)[];
type MappedEntityObject = Record<string, Comparator<MappedEntityValue> | MappedEntityValue>;
export type MappedEntity = Comparator<MappedEntityObject> | MappedEntityObject;

type BodyEntityValue = string | Record<string, unknown> | unknown[];
export type BodyEntity = BodyEntityValue | Comparator<BodyEntityValue>;

type VariablesEntityValue = Record<string, unknown>;
export type VariablesEntity = Comparator<VariablesEntityValue> | VariablesEntityValue;

export type WsRawEntity = (raw: string | Buffer) => boolean;
export type WsIsBinaryEntity = boolean | Comparator<boolean>;

export type WsCloseCodeEntity = number | Comparator<number>;
export type WsCloseReasonEntity = string | Comparator<string>;

export type WsErrorCodeEntity = string | Comparator<string>;
export type WsErrorMessageEntity = string | Comparator<string>;
