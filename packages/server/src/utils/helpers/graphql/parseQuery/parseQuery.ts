import type { DocumentNode, OperationDefinitionNode, OperationTypeNode } from 'graphql';

import { parse } from 'graphql';

interface ParseDocumentNodeResult {
  operationName: string | undefined;
  operationType: OperationTypeNode;
}

const parseDocumentNode = (node: DocumentNode): ParseDocumentNodeResult => {
  const operationDefinition = node.definitions.find(
    (definition) => definition.kind === 'OperationDefinition'
  ) as OperationDefinitionNode;

  return {
    operationType: operationDefinition.operation,
    operationName: operationDefinition.name?.value ?? undefined
  };
};

export const parseQuery = (query: string) => {
  try {
    const document = parse(query);
    return parseDocumentNode(document);
  } catch {
    return null;
  }
};
