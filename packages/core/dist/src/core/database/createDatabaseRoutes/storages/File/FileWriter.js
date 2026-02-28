"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FileWriter", {
    enumerable: true,
    get: function() {
        return FileWriter;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class FileWriter {
    filePath;
    nextData = null;
    nextDataPromise = null;
    nextDataResolve = null;
    writeIsLocked = false;
    constructor(filePath){
        this.filePath = filePath;
    }
    lockedWrite(data) {
        this.nextData = data;
        var _this_nextDataPromise;
        this.nextDataPromise = (_this_nextDataPromise = this.nextDataPromise) !== null && _this_nextDataPromise !== void 0 ? _this_nextDataPromise : new Promise((resolve)=>{
            this.nextDataResolve = resolve;
        });
        return new Promise((resolve)=>{
            var _this_nextDataPromise;
            (_this_nextDataPromise = this.nextDataPromise) === null || _this_nextDataPromise === void 0 ? void 0 : _this_nextDataPromise.then(()=>{
                resolve();
            });
        });
    }
    async unlockedWrite(data, recursionLevel = 0) {
        this.writeIsLocked = true;
        await _fs.default.promises.writeFile(this.filePath, data, 'utf-8');
        this.writeIsLocked = false;
        // ✅ important:
        // copy content of this.nextData into new variable
        // for avoid infinite recursion of 'unlockedWrite'
        const passedData = this.nextData;
        this.nextData = null;
        if (passedData) {
            await this.unlockedWrite(passedData, recursionLevel + 1);
            if (recursionLevel === 0) {
                var _this_nextDataResolve, _this;
                (_this_nextDataResolve = (_this = this).nextDataResolve) === null || _this_nextDataResolve === void 0 ? void 0 : _this_nextDataResolve.call(_this);
                this.nextDataPromise = null;
                this.nextDataResolve = null;
            }
        }
    }
    write(data) {
        return this.writeIsLocked ? this.lockedWrite(data) : this.unlockedWrite(data);
    }
}
