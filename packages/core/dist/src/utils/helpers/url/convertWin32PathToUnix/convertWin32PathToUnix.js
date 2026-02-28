"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "convertWin32PathToUnix", {
    enumerable: true,
    get: function() {
        return convertWin32PathToUnix;
    }
});
const convertWin32PathToUnix = (win32Path)=>win32Path.replace(/^\\\\\?\\/, '').replace(/\\/g, '/').replace(/\/{2,}/g, '/');
