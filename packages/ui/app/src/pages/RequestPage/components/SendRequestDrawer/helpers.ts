import type { SerializedComparator } from '@/utils/helpers';

import { formatComparator, isSerializedComparator, isSerializedFunction } from '@/utils/helpers';

import type { EntityRow, ResolvedRow, RowInput } from './types';

export const BODY_METHODS = ['patch', 'post', 'put'];

const SHARED_ENTITIES = [
  { name: 'queries', title: 'Queries' },
  { name: 'headers', title: 'Headers' },
  { name: 'cookies', title: 'Cookies' }
];

export const REST_ENTITIES = [{ name: 'params', title: 'Path params' }, ...SHARED_ENTITIES];

export const GRAPHQL_ENTITIES = SHARED_ENTITIES;

const FILLER = 'mock';

export const joinPath = (...parts: (string | undefined)[]) =>
  `/${parts
    .flatMap((part) => (part ?? '').split('/'))
    .filter(Boolean)
    .join('/')}`;

export const formatResponseBody = (body: string) => {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
};

const toPrimitiveString = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : undefined;

const transportable = (value: string) => (value === value.trim() ? value : undefined);

const fromPrimitive = (value: unknown, map: (primitive: string) => string | undefined = String) => {
  const primitive = toPrimitiveString(value);
  return primitive === undefined ? undefined : map(primitive);
};

const fromNumeric = (value: unknown, map: (numeric: number) => string | undefined) =>
  typeof value === 'number' ? map(value) : undefined;

const HAVE_TYPE_VALUES: Record<string, string> = {
  string: FILLER,
  number: '1',
  boolean: 'true'
};

const repeatFiller = (length: number) => (length < 0 ? undefined : 'x'.repeat(length));

type Derive = (comparator: SerializedComparator) => string | undefined;

const deriveUnanimous = (args: unknown[], derive: Derive) => {
  const derived = args.map((argument) =>
    isSerializedComparator(argument) ? derive(argument) : undefined
  );
  const [candidate] = derived;

  return candidate !== undefined && derived.every((value) => value === candidate)
    ? candidate
    : undefined;
};

const deriveFirst = (args: unknown[], derive: Derive) =>
  args
    .flatMap((argument) => {
      if (!isSerializedComparator(argument)) return [];
      const value = derive(argument);
      return value === undefined ? [] : [value];
    })
    .at(0);

const COMPARATOR_DERIVERS: Record<string, (args: unknown[], derive: Derive) => string | undefined> =
  {
    endsWith: ([value]) => fromPrimitive(value, transportable),
    equals: ([value]) => fromPrimitive(value, transportable),
    every: deriveUnanimous,
    exists: () => FILLER,
    greater: ([value]) => fromNumeric(value, (numeric) => String(numeric + 1)),
    greaterOrEquals: ([value]) => fromNumeric(value, String),
    haveType: ([value]) => (typeof value === 'string' ? HAVE_TYPE_VALUES[value] : undefined),
    includes: ([value]) => fromPrimitive(value, transportable),
    inRange: ([value]) =>
      Array.isArray(value) && typeof value[0] === 'number' ? String(value[0]) : undefined,
    length: ([value]) => fromNumeric(value, repeatFiller),
    less: ([value]) => fromNumeric(value, (numeric) => String(numeric - 1)),
    lessOrEquals: ([value]) => fromNumeric(value, String),
    maxLength: ([value]) => fromNumeric(value, (numeric) => (numeric < 1 ? undefined : 'x')),
    minLength: ([value]) => fromNumeric(value, repeatFiller),
    oneOf: deriveFirst,
    some: deriveFirst,
    startsWith: ([value]) => fromPrimitive(value, transportable)
  };

export const deriveComparatorValue = (comparator: SerializedComparator): string | undefined =>
  COMPARATOR_DERIVERS[comparator.$comparator]?.(comparator.args, deriveComparatorValue);

const UNVERIFIABLE_CONDITION = 'cannot be checked automatically';

const REG_EXP_SOURCE = /^\/(.+)\/([a-z]*)$/s;

export const parseRegExp = (source: unknown): RegExp | undefined => {
  if (typeof source !== 'string') return undefined;

  const match = REG_EXP_SOURCE.exec(source);
  if (!match) return undefined;

  const [, pattern, flags] = match;

  try {
    return new RegExp(pattern, flags.replaceAll(/[gy]/g, ''));
  } catch {
    return undefined;
  }
};

const getRowInput = (comparator: SerializedComparator): RowInput => {
  if (comparator.$comparator === 'regExp') {
    const [first] = comparator.args;
    const regExp = parseRegExp(first);

    if (regExp)
      return { condition: `must match ${first}`, validate: (value) => regExp.test(value) };
  }

  return { condition: UNVERIFIABLE_CONDITION };
};

const toEntityRow = (key: string, value: unknown): EntityRow => {
  if (isSerializedComparator(value)) {
    const label = formatComparator(value);
    const derived = deriveComparatorValue(value);

    if (derived === undefined)
      return { key, value: label, comparator: label, input: getRowInput(value) };
    return { key, value: derived, comparator: label, send: derived };
  }

  if (isSerializedFunction(value))
    return {
      key,
      value: 'ƒ comparator',
      comparator: 'ƒ comparator',
      input: { condition: UNVERIFIABLE_CONDITION }
    };

  const stringified = String(value);
  return { key, value: stringified, send: stringified };
};

export const getEntityRows = (entityValue: unknown): EntityRow[] => {
  if (typeof entityValue !== 'object' || entityValue === null) return [];

  if (isSerializedComparator(entityValue)) {
    const label = formatComparator(entityValue);
    return [
      {
        key: '*',
        value: label,
        comparator: label,
        warning: 'comparator on the whole entity — no values can be inferred'
      }
    ];
  }

  return Object.entries(entityValue).map(([key, value]) => toEntityRow(key, value));
};

export const getRowId = (entity: string, key: string) => `${entity}.${key}`;

const resolveRow = (
  entity: string,
  row: EntityRow,
  drafts: Record<string, string>
): ResolvedRow => {
  if (!row.input)
    return {
      ...row,
      draft: '',
      invalid: false,
      ...(row.warning && { issue: `${row.key} — ${row.warning}` })
    };

  const draft = drafts[getRowId(entity, row.key)] ?? '';
  const { condition, validate } = row.input;

  if (!draft)
    return { ...row, draft, invalid: false, issue: `${row.key} — no value entered — ${condition}` };

  if (validate && !validate(draft))
    return {
      ...row,
      draft,
      invalid: true,
      send: draft,
      issue: `${row.key} — invalid value — ${condition}`
    };

  return { ...row, draft, invalid: false, send: draft };
};

export const resolveRows = (
  entity: string,
  rows: EntityRow[],
  drafts: Record<string, string>
): ResolvedRow[] => rows.map((row) => resolveRow(entity, row, drafts));

export const toRecord = (rows: EntityRow[]) =>
  Object.fromEntries(
    rows.flatMap((row) => (row.send === undefined ? [] : [[row.key, row.send] as const]))
  );

export const toCookieHeader = (rows: EntityRow[]) => {
  const cookies = toRecord(rows);
  if (!Object.keys(cookies).length) return undefined;

  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
};

const resolveBodyValue = (value: unknown, path: string, warnings: string[]): unknown => {
  if (isSerializedComparator(value)) {
    const derived = deriveComparatorValue(value);
    if (derived !== undefined) return derived;

    warnings.push(`${path || 'body'} — ${formatComparator(value)}`);
    return undefined;
  }

  if (isSerializedFunction(value)) {
    warnings.push(`${path || 'body'} — ƒ comparator`);
    return undefined;
  }

  if (Array.isArray(value))
    return value.map((item, index) => resolveBodyValue(item, `${path}[${index}]`, warnings));

  if (typeof value === 'object' && value !== null)
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveBodyValue(item, path ? `${path}.${key}` : key, warnings)
      ])
    );

  return value;
};

export const resolveBody = (bodyEntity: unknown) => {
  const warnings: string[] = [];

  if (typeof bodyEntity !== 'object' || bodyEntity === null) return { warnings };

  const resolved = resolveBodyValue(bodyEntity, '', warnings);
  if (resolved === undefined) return { warnings };

  return { body: JSON.stringify(resolved, null, 2), warnings };
};
