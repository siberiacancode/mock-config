import { checkModeSymbol } from '@/utils/constants';

import { getMostSpecificPathFromError } from '../../getMostSpecificPathFromError';
import { getValidationMessageFromPath } from '../../getValidationMessageFromPath';
import { bodyPlainEntitySchema } from './entitiesSchema';

it('Should return correct error path: firstly check object as a descriptor', () => {
  const incorrectTopLevelDescriptorBodyEntities = {
    [checkModeSymbol]: 'equals'
  };
  const topLevelParseResult = bodyPlainEntitySchema.safeParse(
    incorrectTopLevelDescriptorBodyEntities
  );
  expect(topLevelParseResult.success).toBe(false);

  if (!topLevelParseResult.success) {
    const path = getMostSpecificPathFromError(topLevelParseResult.error);
    const validationMessage = getValidationMessageFromPath(path);
    expect(validationMessage).toBe('.value');
  }

  const incorrectPropertyLevelDescriptorBodyEntities = {
    property: {
      [checkModeSymbol]: 'equals'
    }
  };
  const propertyLevelParseResult = bodyPlainEntitySchema.safeParse(
    incorrectPropertyLevelDescriptorBodyEntities
  );
  expect(propertyLevelParseResult.success).toBe(false);

  if (!propertyLevelParseResult.success) {
    const path = getMostSpecificPathFromError(propertyLevelParseResult.error);
    const validationMessage = getValidationMessageFromPath(path);
    expect(validationMessage).toBe('.property.value');
  }
});
