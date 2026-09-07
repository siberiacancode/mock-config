import type { Buffer } from 'node:buffer';

import type { IS_COMPARATOR_SYMBOL } from '@/utils/constants';

export type Comparator<Actual = unknown, Expected = unknown> = ((
  actual: Actual,
  expected: Expected
) => boolean) & {
  [IS_COMPARATOR_SYMBOL]: true;
};

type MappedEntityValue = boolean | number | string | (boolean | number | string)[];
type MappedEntityObject = Record<string, Comparator<MappedEntityValue> | MappedEntityValue>;
export type MappedEntity = Comparator<MappedEntityObject> | MappedEntityObject;

type BodyEntityValue = string | Record<string, unknown> | unknown[];
export type BodyEntity = BodyEntityValue | Comparator<BodyEntityValue>;

type VariablesEntityValue = Record<string, unknown>;
export type VariablesEntity = Comparator<VariablesEntityValue> | VariablesEntityValue;

type WsDataEntityValue =
  | boolean
  | number
  | string
  | Buffer
  | Record<string, unknown>
  | unknown[]
  | null;
export type WsDataEntity = Comparator<WsDataEntityValue> | WsDataEntityValue;
export type WsIsBinaryEntity = boolean | Comparator<boolean>;

export type WsCloseCodeEntity = number | Comparator<number>;
export type WsCloseReasonEntity = string | Comparator<string>;

export type WsErrorCodeEntity = string | Comparator<string>;
export type WsErrorMessageEntity = string | Comparator<string>;
