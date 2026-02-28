"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "findIndexById", {
    enumerable: true,
    get: function() {
        return findIndexById;
    }
});
const findIndexById = (array, id)=>array.findIndex((item)=>item.id.toString() === id.toString());
