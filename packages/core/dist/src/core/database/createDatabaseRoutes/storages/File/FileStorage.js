"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FileStorage", {
    enumerable: true,
    get: function() {
        return FileStorage;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _constants = require("../../../../../utils/constants");
const _helpers = require("../../helpers");
const _FileWriter = require("./FileWriter");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class FileStorage {
    fileWriter;
    data;
    constructor(fileName){
        const filePath = _path.default.resolve(_constants.APP_PATH, fileName);
        this.fileWriter = new _FileWriter.FileWriter(filePath);
        this.data = JSON.parse(_fs.default.readFileSync(filePath, 'utf-8'));
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
        this.fileWriter.write(JSON.stringify(this.data));
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
        } else {
            delete deletable[keys[index]];
        }
        this.fileWriter.write(JSON.stringify(this.data));
    }
}
