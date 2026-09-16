import { isSerializedFunction } from './isSerializedFunction';

export interface SerializedComparator {
  $comparator: string;
  args: unknown[];
}

export const isSerializedComparator = (value: unknown): value is SerializedComparator =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as SerializedComparator).$comparator === 'string' &&
  Array.isArray((value as SerializedComparator).args);

export const formatComparatorArguments = (comparator: SerializedComparator): string =>
  comparator.args
    .map((argument) => {
      if (isSerializedComparator(argument))
        return `${argument.$comparator}(${formatComparatorArguments(argument)})`;
      if (isSerializedFunction(argument)) return 'ƒ';
      return JSON.stringify(argument) ?? String(argument);
    })
    .join(', ');

export const formatComparator = (comparator: SerializedComparator) =>
  `${comparator.$comparator}(${formatComparatorArguments(comparator)})`;

export const getComparatorFunctionSources = (comparator: SerializedComparator): string[] =>
  comparator.args.flatMap((argument) => {
    if (isSerializedComparator(argument)) return getComparatorFunctionSources(argument);
    if (isSerializedFunction(argument)) return [argument];
    return [];
  });
