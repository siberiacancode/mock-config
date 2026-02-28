"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createDatabaseRoutes", {
    enumerable: true,
    get: function() {
        return createDatabaseRoutes;
    }
});
const _createStorage = require("../createStorage/createStorage");
const _helpers = require("./helpers");
const _storages = require("./storages");
const isVariableJsonFile = (variable)=>typeof variable === 'string' && variable.endsWith('.json');
const createDatabaseRoutes = (router, { data, routes })=>{
    if (routes) {
        const storage = (0, _createStorage.createStorage)(routes);
        (0, _helpers.createRewrittenDatabaseRoutes)(router, storage.read());
        router.route('/__routes').get((_request, response)=>{
            response.json(storage.read());
        });
    }
    const storage = isVariableJsonFile(data) ? new _storages.FileStorage(data) : new _storages.MemoryStorage(data);
    const { shallowDatabase, nestedDatabase } = (0, _helpers.splitDatabaseByNesting)(storage.read());
    (0, _helpers.createShallowDatabaseRoutes)(router, shallowDatabase, storage);
    (0, _helpers.createNestedDatabaseRoutes)(router, nestedDatabase, storage);
    router.route('/__db').get((_request, response)=>{
        response.json(storage.read());
    });
    return router;
};
