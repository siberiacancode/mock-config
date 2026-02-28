"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "splitDatabaseByNesting", {
    enumerable: true,
    get: function() {
        return splitDatabaseByNesting;
    }
});
const _helpers = require("../../../../../utils/helpers");
const isAllArrayElementsHaveValidTypeId = (array)=>array.every((element)=>(0, _helpers.isPlainObject)(element) && (typeof element.id === 'number' || typeof element.id === 'string'));
const isAllArrayElementsHaveUniqueId = (array)=>{
    const uniqueIdsCount = new Set(array.map(({ id })=>id)).size;
    return array.length === uniqueIdsCount;
};
const splitDatabaseByNesting = (data)=>{
    const shallowDatabase = {};
    const nestedDatabase = {};
    Object.entries(data).forEach(([databaseEntityKey, databaseEntityValue])=>{
        if (Array.isArray(databaseEntityValue) && isAllArrayElementsHaveValidTypeId(databaseEntityValue) && isAllArrayElementsHaveUniqueId(databaseEntityValue)) {
            nestedDatabase[databaseEntityKey] = databaseEntityValue;
            return;
        }
        shallowDatabase[databaseEntityKey] = databaseEntityValue;
    });
    return {
        shallowDatabase,
        nestedDatabase
    };
};
