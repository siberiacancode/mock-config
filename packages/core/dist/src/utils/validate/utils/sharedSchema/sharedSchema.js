"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get stringForwardSlashSchema () {
        return stringForwardSlashSchema;
    },
    get stringJsonFilenameSchema () {
        return stringJsonFilenameSchema;
    }
});
const _zod = require("zod");
const stringForwardSlashSchema = _zod.z.string().startsWith('/');
const stringJsonFilenameSchema = _zod.z.string().endsWith('.json');
