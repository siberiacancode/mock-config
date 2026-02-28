"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "filterTokens", {
    enumerable: true,
    get: function() {
        return filterTokens;
    }
});
const _isPlainObject = require("../../../isPlainObject/isPlainObject");
const resolveNestedOptionFilterMode = (nestedOption)=>{
    const values = Object.values(nestedOption);
    return values.some(Boolean) ? 'whitelist' : 'blacklist';
};
const filterTokens = (tokens, options)=>Object.entries(options).reduce((acc, [name, option])=>{
        const token = tokens[name];
        if (option === true) {
            acc[name] = token;
            return acc;
        }
        const isNestedOption = (0, _isPlainObject.isPlainObject)(option);
        const isNestedToken = (0, _isPlainObject.isPlainObject)(token);
        if (isNestedOption && isNestedToken) {
            const nestedOptionFilterMode = resolveNestedOptionFilterMode(option);
            if (nestedOptionFilterMode === 'whitelist') {
                acc[name] = Object.entries(option).reduce((acc, [name, nestedOption])=>{
                    if (nestedOption) {
                        acc[name] = token[name];
                    }
                    return acc;
                }, {});
            }
            if (nestedOptionFilterMode === 'blacklist') {
                acc[name] = Object.keys(token).reduce((acc, name)=>{
                    if (option[name] !== false) {
                        acc[name] = token[name];
                    }
                    return acc;
                }, {});
            }
        }
        return acc;
    }, {});
