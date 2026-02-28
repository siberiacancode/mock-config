"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "formatTokens", {
    enumerable: true,
    get: function() {
        return formatTokens;
    }
});
const _date = require("../../../date");
const formatTokens = (tokens)=>{
    const { timestamp, method } = tokens;
    return {
        ...tokens,
        ...timestamp && {
            timestamp: (0, _date.formatTimestamp)(timestamp)
        },
        ...method && {
            method: method.toUpperCase()
        }
    };
};
