"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getMostSpecificPathFromError", {
    enumerable: true,
    get: function() {
        return getMostSpecificPathFromError;
    }
});
const _zod = require("zod");
const getMostSpecificPathFromError = (error)=>{
    let currentMostSpecificPath = [];
    for (const issue of error.issues){
        if (issue.code === _zod.z.ZodIssueCode.invalid_union) {
            for (const unionError of issue.unionErrors){
                const unionErrorMostSpecificPath = getMostSpecificPathFromError(unionError);
                if (unionErrorMostSpecificPath.length > currentMostSpecificPath.length) {
                    currentMostSpecificPath = unionErrorMostSpecificPath;
                }
            }
            continue;
        }
        if (issue.code === _zod.z.ZodIssueCode.unrecognized_keys) {
            const [unrecognizedKey] = issue.keys;
            const issuePath = [
                ...issue.path,
                unrecognizedKey
            ];
            if (issuePath.length > currentMostSpecificPath.length) {
                currentMostSpecificPath = issuePath;
            }
            continue;
        }
        if (issue.path.length > currentMostSpecificPath.length) {
            currentMostSpecificPath = issue.path;
        }
    }
    return currentMostSpecificPath;
};
