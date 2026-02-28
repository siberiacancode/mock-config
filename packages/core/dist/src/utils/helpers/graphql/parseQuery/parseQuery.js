"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "parseQuery", {
    enumerable: true,
    get: function() {
        return parseQuery;
    }
});
const _graphql = require("graphql");
const parseDocumentNode = (node)=>{
    var _operationDefinition_name;
    const operationDefinition = node.definitions.find((definition)=>definition.kind === 'OperationDefinition');
    var _operationDefinition_name_value;
    return {
        operationType: operationDefinition.operation,
        operationName: (_operationDefinition_name_value = (_operationDefinition_name = operationDefinition.name) === null || _operationDefinition_name === void 0 ? void 0 : _operationDefinition_name.value) !== null && _operationDefinition_name_value !== void 0 ? _operationDefinition_name_value : undefined
    };
};
const parseQuery = (query)=>{
    try {
        const document = (0, _graphql.parse)(query);
        return parseDocumentNode(document);
    } catch  {
        return null;
    }
};
