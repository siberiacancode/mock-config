"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "parseCookie", {
    enumerable: true,
    get: function() {
        return parseCookie;
    }
});
const parseCookie = (cookieHeader)=>{
    if (!cookieHeader) return {};
    const cookies = {};
    const cookiePairs = cookieHeader.split(';');
    cookiePairs.forEach((cookie)=>{
        const [name, value] = cookie.trim().split('=');
        if (!name) return;
        var _value_trim;
        cookies[name.trim()] = (_value_trim = value === null || value === void 0 ? void 0 : value.trim()) !== null && _value_trim !== void 0 ? _value_trim : '';
    });
    return cookies;
};
