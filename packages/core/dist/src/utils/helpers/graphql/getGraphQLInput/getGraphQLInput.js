"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getGraphQLInput", {
    enumerable: true,
    get: function() {
        return getGraphQLInput;
    }
});
const getGraphQLInput = (request)=>{
    if (request.method === 'GET') {
        var _request_query, _request_query1;
        const query = (_request_query = request.query) === null || _request_query === void 0 ? void 0 : _request_query.query;
        const variables = (_request_query1 = request.query) === null || _request_query1 === void 0 ? void 0 : _request_query1.variables;
        // ✅ important:
        // if 'variables' was sent as encoded uri component then it already decoded into object and we do not need to use JSON.parse
        return {
            query: query === null || query === void 0 ? void 0 : query.toString(),
            variables: typeof variables === 'string' ? JSON.parse(variables) : variables
        };
    }
    if (request.method === 'POST') {
        var _request_body, _request_body1;
        const query = (_request_body = request.body) === null || _request_body === void 0 ? void 0 : _request_body.query;
        const variables = (_request_body1 = request.body) === null || _request_body1 === void 0 ? void 0 : _request_body1.variables;
        return {
            query,
            variables
        };
    }
    throw new Error(`Not allowed request method ${request.method} for graphql request`);
};
