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
    get search () {
        return search;
    },
    get searchInNestedObjects () {
        return searchInNestedObjects;
    }
});
const searchInNestedObjects = (obj, searchText)=>{
    for(const key in obj){
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (searchInNestedObjects(obj[key], searchText)) {
                return true;
            }
        } else if (String(obj[key]).includes(searchText)) {
            return true;
        }
    }
    return false;
};
const search = (array, searchText)=>array.filter((element)=>{
        if (typeof searchText === 'string') {
            return searchInNestedObjects(element, searchText);
        }
        if (Array.isArray(searchText)) {
            return searchText.some((text)=>searchInNestedObjects(element, text));
        }
        throw new Error('search technical error');
    });
