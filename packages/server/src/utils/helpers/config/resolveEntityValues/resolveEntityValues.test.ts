import { describe, expect, it, vi } from 'vitest';

import type { CheckFunction, CheckMode } from '@/utils/types';

import { checkModeSymbol } from '@/utils/constants';

import { resolveEntityValues } from './resolveEntityValues';

describe('resolveEntityValues: checkMode without descriptor value', () => {
  it('"exists"/"notExists" checkMode should return false/true only for undefined', () => {
    const existedValues = ['string', true, 3000, null, {}, [], () => {}, /\d/];
    existedValues.forEach((value) => {
      expect(resolveEntityValues({ [checkModeSymbol]: 'exists', actualValue: value })).toBe(true);
      expect(resolveEntityValues({ [checkModeSymbol]: 'notExists', actualValue: value })).toBe(
        false
      );
    });

    const nonExistedValues = [undefined];
    nonExistedValues.forEach((value) => {
      expect(resolveEntityValues({ [checkModeSymbol]: 'exists', actualValue: value })).toBe(false);
      expect(resolveEntityValues({ [checkModeSymbol]: 'notExists', actualValue: value })).toBe(
        true
      );
    });
  });
});

describe('resolveEntityValues: checkMode with descriptor value', () => {
  describe('"regExp" checkMode', () => {
    it('Should correctly test actual value against descriptor regExp', () => {
      expect(
        resolveEntityValues({
          [checkModeSymbol]: 'regExp',
          actualValue: 'string',
          descriptorValue: /string/
        })
      ).toBe(true);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: 'regExp',
          actualValue: 'String',
          descriptorValue: /string/
        })
      ).toBe(false);
    });

    // ✅ important:
    // this is about https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex#avoiding_side_effects
    it('Should be independent of regExp "lastIndex" property when this regExp using "g" flag', () => {
      const regExpWithGlobalFlag = /string/g;
      expect(
        resolveEntityValues({
          [checkModeSymbol]: 'regExp',
          actualValue: 'string',
          descriptorValue: regExpWithGlobalFlag
        })
      ).toBe(true);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: 'regExp',
          actualValue: 'string',
          descriptorValue: regExpWithGlobalFlag
        })
      ).toBe(true);
    });
  });

  describe('"function" checkMode', () => {
    it('Should define resolving result by descriptor function truthy/falsy return value', () => {
      expect(
        resolveEntityValues({
          [checkModeSymbol]: 'function',
          actualValue: 'primitive',
          descriptorValue: () => 'truthy'
        })
      ).toBe(true);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: 'function',
          actualValue: 'primitive',
          descriptorValue: () => ''
        })
      ).toBe(false);
    });

    it('Should call descriptor function with correct arguments', () => {
      const descriptorFn = vi.fn();
      resolveEntityValues({
        [checkModeSymbol]: 'function',
        actualValue: 'primitive',
        descriptorValue: descriptorFn
      });
      expect(descriptorFn).toBeCalledTimes(1);
      expect(descriptorFn).toBeCalledWith('primitive', expect.any(Function));
    });

    it('Should support nested function calls using checkFunction', () => {
      expect(
        resolveEntityValues({
          [checkModeSymbol]: 'function',
          actualValue: 'primitive',
          descriptorValue: (actualValue: string, checkFunction: CheckFunction) =>
            checkFunction('function', actualValue, () => actualValue === 'primitive')
        })
      ).toBe(true);
    });
  });

  it('Should compare values independent of their types', () => {
    const positiveCheckModes = [
      'equals',
      'includes',
      'startsWith',
      'endsWith'
    ] satisfies CheckMode[];
    positiveCheckModes.forEach((positiveCheckMode) => {
      expect(
        resolveEntityValues({
          [checkModeSymbol]: positiveCheckMode,
          actualValue: '12',
          descriptorValue: 12
        })
      ).toBe(true);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: positiveCheckMode,
          actualValue: 'true',
          descriptorValue: true
        })
      ).toBe(true);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: positiveCheckMode,
          actualValue: 'string',
          descriptorValue: 'string'
        })
      ).toBe(true);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: positiveCheckMode,
          actualValue: 'null',
          descriptorValue: null
        })
      ).toBe(true);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: positiveCheckMode,
          actualValue: 'undefined',
          descriptorValue: undefined
        })
      ).toBe(true);
    });

    const negativeCheckModes = [
      'notEquals',
      'notIncludes',
      'notStartsWith',
      'notEndsWith'
    ] satisfies CheckMode[];
    negativeCheckModes.forEach((negativeCheckMode) => {
      expect(
        resolveEntityValues({
          [checkModeSymbol]: negativeCheckMode,
          actualValue: '12',
          descriptorValue: 12
        })
      ).toBe(false);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: negativeCheckMode,
          actualValue: 'true',
          descriptorValue: true
        })
      ).toBe(false);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: negativeCheckMode,
          actualValue: 'string',
          descriptorValue: 'string'
        })
      ).toBe(false);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: negativeCheckMode,
          actualValue: 'null',
          descriptorValue: null
        })
      ).toBe(false);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: negativeCheckMode,
          actualValue: 'undefined',
          descriptorValue: undefined
        })
      ).toBe(false);
    });
  });

  it('Should return false/true for positive/negative check modes when primitive and object are compared', () => {
    const positiveCheckModes = [
      'equals',
      'includes',
      'startsWith',
      'endsWith'
    ] satisfies CheckMode[];
    positiveCheckModes.forEach((positiveCheckMode) => {
      expect(
        resolveEntityValues({
          [checkModeSymbol]: positiveCheckMode,
          actualValue: 'primitive',
          descriptorValue: ['primitive', { property: 'primitive' }]
        })
      ).toBe(false);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: positiveCheckMode,
          actualValue: ['primitive', { property: 'primitive' }],
          descriptorValue: 'primitive'
        })
      ).toBe(false);
    });

    const negativeCheckModes = [
      'notEquals',
      'notIncludes',
      'notStartsWith',
      'notEndsWith'
    ] satisfies CheckMode[];
    negativeCheckModes.forEach((negativeCheckMode) => {
      expect(
        resolveEntityValues({
          [checkModeSymbol]: negativeCheckMode,
          actualValue: 'primitive',
          descriptorValue: ['primitive', { property: 'primitive' }]
        })
      ).toBe(true);
      expect(
        resolveEntityValues({
          [checkModeSymbol]: negativeCheckMode,
          actualValue: ['primitive', { property: 'primitive' }],
          descriptorValue: 'primitive'
        })
      ).toBe(true);
    });
  });

  it('"equals"/"notEquals" checkMode should return true/false when actual and descriptor values are equal', () => {
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'equals',
        actualValue: 'primitive',
        descriptorValue: 'primitive'
      })
    ).toBe(true);
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'equals',
        actualValue: ['primitive', { property: 'primitive' }],
        descriptorValue: ['primitive', { property: 'primitive' }]
      })
    ).toBe(true);

    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'notEquals',
        actualValue: 'primitive',
        descriptorValue: 'primitive'
      })
    ).toBe(false);
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'notEquals',
        actualValue: ['primitive', { property: 'primitive' }],
        descriptorValue: ['primitive', { property: 'primitive' }]
      })
    ).toBe(false);
  });

  it('"includes"/"notIncludes" checkMode should return true/false when actual value includes descriptor value', () => {
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'includes',
        actualValue: 'primitive',
        descriptorValue: 'primitive'.slice(1, 2)
      })
    ).toBe(true);
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'includes',
        actualValue: ['primitive', { property: 'primitive' }],
        descriptorValue: ['primitive'.slice(1, 2), { property: 'primitive'.slice(1, 2) }]
      })
    ).toBe(true);

    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'notIncludes',
        actualValue: 'primitive',
        descriptorValue: 'primitive'.slice(1, 2)
      })
    ).toBe(false);
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'notIncludes',
        actualValue: ['primitive', { property: 'primitive' }],
        descriptorValue: ['primitive'.slice(1, 2), { property: 'primitive'.slice(1, 2) }]
      })
    ).toBe(false);
  });

  it('"startsWith"/"notStartsWith" checkMode should return true/false when actual value starts with descriptor value', () => {
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'startsWith',
        actualValue: 'primitive',
        descriptorValue: 'primitive'.slice(0, 2)
      })
    ).toBe(true);
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'startsWith',
        actualValue: ['primitive', { property: 'primitive' }],
        descriptorValue: ['primitive'.slice(0, 2), { property: 'primitive'.slice(0, 2) }]
      })
    ).toBe(true);

    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'notStartsWith',
        actualValue: 'primitive',
        descriptorValue: 'primitive'.slice(0, 2)
      })
    ).toBe(false);
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'notStartsWith',
        actualValue: ['primitive', { property: 'primitive' }],
        descriptorValue: ['primitive'.slice(0, 2), { property: 'primitive'.slice(0, 2) }]
      })
    ).toBe(false);
  });

  it('"endsWith"/"notEndsWith" checkMode should return true/false when actual value ends with descriptor value', () => {
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'endsWith',
        actualValue: 'primitive',
        descriptorValue: 'primitive'.slice(1)
      })
    ).toBe(true);
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'endsWith',
        actualValue: ['primitive', { property: 'primitive' }],
        descriptorValue: ['primitive'.slice(1), { property: 'primitive'.slice(1) }]
      })
    ).toBe(true);

    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'notEndsWith',
        actualValue: 'primitive',
        descriptorValue: 'primitive'.slice(1)
      })
    ).toBe(false);
    expect(
      resolveEntityValues({
        [checkModeSymbol]: 'notEndsWith',
        actualValue: ['primitive', { property: 'primitive' }],
        descriptorValue: ['primitive'.slice(1), { property: 'primitive'.slice(1) }]
      })
    ).toBe(false);
  });
});
