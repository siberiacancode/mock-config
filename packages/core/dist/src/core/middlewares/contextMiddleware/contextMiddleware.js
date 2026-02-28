"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "contextMiddleware", {
    enumerable: true,
    get: function() {
        return contextMiddleware;
    }
});
const _database = require("../../database");
const _helpers = require("../../../utils/helpers");
const contextMiddleware = (server, { database })=>{
    let requestId = 0;
    const context = {
        orm: {}
    };
    if (database) {
        const storage = (0, _database.createStorage)(database.data);
        const orm = (0, _database.createOrm)(storage);
        context.orm = orm;
    }
    server.use((request, _response, next)=>{
        requestId += 1;
        request.id = requestId;
        request.timestamp = Date.now();
        request.graphQL = null;
        if (request.method === 'GET' || request.method === 'POST') {
            const graphQLInput = (0, _helpers.getGraphQLInput)(request);
            var _graphQLInput_query;
            const graphQLQuery = (0, _helpers.parseQuery)((_graphQLInput_query = graphQLInput.query) !== null && _graphQLInput_query !== void 0 ? _graphQLInput_query : '');
            if (graphQLInput.query && graphQLQuery) {
                request.graphQL = {
                    operationType: graphQLQuery.operationType,
                    operationName: graphQLQuery.operationName,
                    query: graphQLInput.query,
                    variables: graphQLInput.variables
                };
            }
        }
        request.context = context;
        return next();
    });
};
