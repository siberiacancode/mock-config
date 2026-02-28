"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "portSchema", {
    enumerable: true,
    get: function() {
        return portSchema;
    }
});
const _zod = require("zod");
const MAX_PORT = 65535;
const portSchema = _zod.z.number().int().nonnegative().max(MAX_PORT);
