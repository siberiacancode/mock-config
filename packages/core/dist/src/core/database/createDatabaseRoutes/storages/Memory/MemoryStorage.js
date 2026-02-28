"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MemoryStorage", {
    enumerable: true,
    get: function() {
        return MemoryStorage;
    }
});
const _helpers = require("../../helpers");
class MemoryStorage {
    data;
    constructor(initialData){
        this.data = initialData;
    }
    read(key) {
        if (!key) return this.data;
        const keys = Array.isArray(key) ? key : [
            key
        ];
        let readable = this.data;
        for (const currentKey of keys){
            readable = readable[currentKey];
        }
        return readable;
    }
    write(key, value) {
        const keys = Array.isArray(key) ? key : [
            key
        ];
        let writable = this.data;
        let index = 0;
        // ✅ important:
        // stop iterate one element before end of keys for get access to writable object property
        while(index < keys.length - 1){
            writable = writable[keys[index]];
            index += 1;
        }
        writable[keys[index]] = value;
    }
    delete(key) {
        const keys = Array.isArray(key) ? key : [
            key
        ];
        let deletable = this.data;
        let index = 0;
        // ✅ important:
        // stop iterate one element before end of key for get access to deletable object property
        while(index < keys.length - 1){
            deletable = deletable[keys[index]];
            index += 1;
        }
        if (Array.isArray(deletable) && (0, _helpers.isIndex)(keys[index])) {
            deletable.splice(keys[index], 1);
            return;
        }
        delete deletable[keys[index]];
    }
}
