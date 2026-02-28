"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createNewId", {
    enumerable: true,
    get: function() {
        return createNewId;
    }
});
const createNewId = (array)=>{
    let maxId = -1;
    for(let i = 0; i < array.length; i += 1){
        if (typeof array[i].id === 'number' && array[i].id > maxId) {
            maxId = array[i].id;
        }
    }
    return maxId + 1;
};
