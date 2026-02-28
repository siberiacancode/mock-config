"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "sleep", {
    enumerable: true,
    get: function() {
        return sleep;
    }
});
const sleep = (milliseconds)=>new Promise((resolve)=>{
        setTimeout(resolve, milliseconds);
    });
