import { describe, expect, it } from 'vitest';

import { getMostSpecificPathFromError } from '../../getMostSpecificPathFromError';
import { getValidationMessageFromPath } from '../../getValidationMessageFromPath';
import {
  closeRouteConfigSchema,
  errorRouteConfigSchema,
  rawRouteConfigSchema,
  routeConfigSchema
} from './routeConfigSchema';

const data = () => ({ ok: true });

describe('routeConfigSchema: data resolving properties combinations', () => {
  const incorrectDataResolvingPropertiesCombinations = [{}];
  incorrectDataResolvingPropertiesCombinations.forEach(
    (incorrectDataResolvingPropertiesCombination) => {
      it(`Should return error on handle object with incorrect data resolving properties combination:\n${JSON.stringify(
        incorrectDataResolvingPropertiesCombination
      )}`, () => {
        const parseResult = routeConfigSchema.safeParse(
          incorrectDataResolvingPropertiesCombination
        );
        expect(parseResult.success).toBe(false);

        if (!parseResult.success) {
          const path = getMostSpecificPathFromError(parseResult.error);
          const validationMessage = getValidationMessageFromPath(path);
          expect(validationMessage).toBe('');
        }
      });
    }
  );

  const correctDataResolvingPropertiesCombinations = [{ data: () => ({ ok: true }) }];
  correctDataResolvingPropertiesCombinations.forEach(
    (correctDataResolvingPropertiesCombination) => {
      it('Should pass object with function data resolving strategy', () => {
        const parseResult = routeConfigSchema.safeParse(correctDataResolvingPropertiesCombination);
        expect(parseResult.success).toBe(true);
      });
    }
  );
});

describe('rawRouteConfigSchema: entities', () => {
  it('Should pass route config without entities', () => {
    expect(rawRouteConfigSchema.safeParse({ data }).success).toBe(true);
  });

  it('Should pass supported entities', () => {
    const parseResult = rawRouteConfigSchema.safeParse({
      data,
      entities: { data: { type: 'ping' }, isBinary: false }
    });
    expect(parseResult.success).toBe(true);
  });

  it('Should return error on invalid isBinary entity', () => {
    const parseResult = rawRouteConfigSchema.safeParse({
      data,
      entities: { isBinary: 'false' }
    });
    expect(parseResult.success).toBe(false);
  });

  it('Should return error on unsupported entity name', () => {
    const parseResult = rawRouteConfigSchema.safeParse({
      data,
      entities: { raw: 'ping' }
    });
    expect(parseResult.success).toBe(false);
  });
});

describe('closeRouteConfigSchema: entities', () => {
  it('Should pass route config without entities', () => {
    expect(closeRouteConfigSchema.safeParse({ data }).success).toBe(true);
  });

  it('Should pass supported entities', () => {
    const parseResult = closeRouteConfigSchema.safeParse({
      data,
      entities: { code: 1000, reason: 'normal closure' }
    });
    expect(parseResult.success).toBe(true);
  });

  it('Should return error on invalid code entity', () => {
    const parseResult = closeRouteConfigSchema.safeParse({
      data,
      entities: { code: '1000' }
    });
    expect(parseResult.success).toBe(false);
  });
});

describe('errorRouteConfigSchema: entities', () => {
  it('Should pass route config without entities', () => {
    expect(errorRouteConfigSchema.safeParse({ data }).success).toBe(true);
  });

  it('Should pass supported entities', () => {
    const parseResult = errorRouteConfigSchema.safeParse({
      data,
      entities: { code: 'ECONNRESET', message: 'socket error' }
    });
    expect(parseResult.success).toBe(true);
  });

  it('Should return error on invalid message entity', () => {
    const parseResult = errorRouteConfigSchema.safeParse({
      data,
      entities: { message: 1 }
    });
    expect(parseResult.success).toBe(false);
  });

  it('Should return error on invalid code entity', () => {
    const parseResult = errorRouteConfigSchema.safeParse({
      data,
      entities: { code: 1000 }
    });
    expect(parseResult.success).toBe(false);
  });

  it('Should return error on unsupported entity name', () => {
    const parseResult = errorRouteConfigSchema.safeParse({
      data,
      entities: { reason: 'socket error' }
    });
    expect(parseResult.success).toBe(false);
  });
});
