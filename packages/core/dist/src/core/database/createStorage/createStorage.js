"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createStorage", {
    enumerable: true,
    get: function() {
        return createStorage;
    }
});
const _storages = require("../createDatabaseRoutes/storages");
const isVariableJsonFile = (variable)=>typeof variable === 'string' && variable.endsWith('.json');
const createStorage = (data)=>isVariableJsonFile(data) ? new _storages.FileStorage(data) : new _storages.MemoryStorage(data);
