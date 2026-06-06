import type { DocumentNode, OperationDefinitionNode, OperationTypeNode } from 'graphql';

import { parse } from 'graphql';

interface ParseDocumentNodeResult {
  eventName?: string;
  operationName?: string;
  operationType: OperationTypeNode;
}

const parseDocumentNode = (node: DocumentNode): ParseDocumentNodeResult => {
  const operationDefinition = node.definitions.find(
    (definition) => definition.kind === 'OperationDefinition'
  ) as OperationDefinitionNode;

  const eventName = operationDefinition.selectionSet.selections.find(
    (selection) => selection.kind === 'Field'
  )?.name.value;

  return {
    operationType: operationDefinition.operation,
    operationName: operationDefinition.name?.value ?? undefined,
    eventName
  };
};

export const parseGraphQLQuery = (query: string) => {
  try {
    const document = parse(query);
    return parseDocumentNode(document);
  } catch {
    return null;
  }
};
