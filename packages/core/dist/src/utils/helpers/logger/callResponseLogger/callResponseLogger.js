"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "callResponseLogger", {
    enumerable: true,
    get: function() {
        return callResponseLogger;
    }
});
const _helpers = require("../helpers");
const DEFAULT_RESPONSE_LOGGER_OPTIONS = {
    type: true,
    id: true,
    timestamp: true,
    method: true,
    url: true,
    statusCode: true,
    data: true
};
const callResponseLogger = ({ logger, data, request, response })=>{
    var _request_graphQL, _request_graphQL1, _request_graphQL2, _request_graphQL3;
    var _request_graphQL_operationType, _request_graphQL_operationName, _request_graphQL_query, _request_graphQL_variables;
    const tokens = {
        type: 'response',
        id: request.id,
        timestamp: Date.now(),
        method: request.method.toLowerCase(),
        url: decodeURI(`${request.protocol}://${request.get('host')}${request.originalUrl}`),
        graphQLOperationType: (_request_graphQL_operationType = (_request_graphQL = request.graphQL) === null || _request_graphQL === void 0 ? void 0 : _request_graphQL.operationType) !== null && _request_graphQL_operationType !== void 0 ? _request_graphQL_operationType : null,
        graphQLOperationName: (_request_graphQL_operationName = (_request_graphQL1 = request.graphQL) === null || _request_graphQL1 === void 0 ? void 0 : _request_graphQL1.operationName) !== null && _request_graphQL_operationName !== void 0 ? _request_graphQL_operationName : null,
        graphQLQuery: (_request_graphQL_query = (_request_graphQL2 = request.graphQL) === null || _request_graphQL2 === void 0 ? void 0 : _request_graphQL2.query) !== null && _request_graphQL_query !== void 0 ? _request_graphQL_query : null,
        variables: (_request_graphQL_variables = (_request_graphQL3 = request.graphQL) === null || _request_graphQL3 === void 0 ? void 0 : _request_graphQL3.variables) !== null && _request_graphQL_variables !== void 0 ? _request_graphQL_variables : null,
        statusCode: response.statusCode,
        headers: request.headers,
        cookies: request.cookies,
        query: request.query,
        params: request.params,
        body: request.body,
        data
    };
    var _logger_options;
    const options = (_logger_options = logger === null || logger === void 0 ? void 0 : logger.options) !== null && _logger_options !== void 0 ? _logger_options : DEFAULT_RESPONSE_LOGGER_OPTIONS;
    const filteredTokens = (0, _helpers.filterTokens)(tokens, options);
    if (logger === null || logger === void 0 ? void 0 : logger.rewrite) {
        logger.rewrite(filteredTokens);
        return filteredTokens;
    }
    const formattedTokens = (0, _helpers.formatTokens)(filteredTokens);
    console.dir(formattedTokens, {
        depth: null
    });
    return filteredTokens;
};
