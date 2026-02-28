import type { OperationTypeNode } from 'graphql';
interface ParseDocumentNodeResult {
    operationName: string | undefined;
    operationType: OperationTypeNode;
}
export declare const parseQuery: (query: string) => ParseDocumentNodeResult | null;
export {};
