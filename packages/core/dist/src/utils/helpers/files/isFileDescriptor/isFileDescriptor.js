"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isFileDescriptor", {
    enumerable: true,
    get: function() {
        return isFileDescriptor;
    }
});
const _buffer = require("buffer");
const _zod = require("zod");
const isFileDescriptor = (value)=>_zod.z.object({
        path: _zod.z.string(),
        file: _zod.z.instanceof(_buffer.Buffer)
    }).strict().safeParse(value).success;
