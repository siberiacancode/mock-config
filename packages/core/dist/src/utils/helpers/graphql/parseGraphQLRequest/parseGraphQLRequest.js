"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "parseGraphQLRequest", {
    enumerable: true,
    get: function() {
        return parseGraphQLRequest;
    }
});
const _getGraphQLInput = require("../getGraphQLInput/getGraphQLInput");
const _parseQuery = require("../parseQuery/parseQuery");
const parseGraphQLRequest = (request)=>{
    const graphQLInput = (0, _getGraphQLInput.getGraphQLInput)(request);
    if (!graphQLInput.query) return null;
    return (0, _parseQuery.parseQuery)(graphQLInput.query);
};
