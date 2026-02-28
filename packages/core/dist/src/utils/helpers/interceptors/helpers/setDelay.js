"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "setDelay", {
    enumerable: true,
    get: function() {
        return setDelay;
    }
});
const _sleep = require("../../sleep");
const setDelay = async (delay)=>{
    await (0, _sleep.sleep)(delay === Infinity ? 99999999 : delay);
};
