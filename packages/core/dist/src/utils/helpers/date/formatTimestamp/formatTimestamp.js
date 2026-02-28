"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "formatTimestamp", {
    enumerable: true,
    get: function() {
        return formatTimestamp;
    }
});
const formatTimestamp = (timestamp)=>new Date(timestamp).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        fractionalSecondDigits: 3
    });
