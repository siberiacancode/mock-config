import { getValidationMessage } from '../../getValidationMessage';
import { bodyPlainEntitySchema } from './entitiesSchema';

it('Should return correct error path: firstly check object as a descriptor', () => {
  const incorrectTopLevelDescriptorBodyEntities = {
    checkMode: 'equals'
  };
  const topLevelParseResult = bodyPlainEntitySchema.safeParse(
    incorrectTopLevelDescriptorBodyEntities
  );
  expect(topLevelParseResult.success).toBe(false);

  if (!topLevelParseResult.success) {
    const validationMessage = getValidationMessage(topLevelParseResult.error.issues);
    expect(validationMessage).toBe('.value');
  }

  const incorrectPropertyLevelDescriptorBodyEntities = {
    property: {
      checkMode: 'equals'
    }
  };
  const propertyLevelParseResult = bodyPlainEntitySchema.safeParse(
    incorrectPropertyLevelDescriptorBodyEntities
  );
  expect(propertyLevelParseResult.success).toBe(false);

  if (!propertyLevelParseResult.success) {
    const validationMessage = getValidationMessage(propertyLevelParseResult.error.issues);
    expect(validationMessage).toBe('.property.value');
  }
});
