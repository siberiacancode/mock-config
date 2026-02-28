"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
_export_star(require("./checkModeSchema/checkModeSchema"), exports);
_export_star(require("./entitiesSchema/entitiesSchema"), exports);
_export_star(require("./extendedDiscriminatedUnion/extendedDiscriminatedUnion"), exports);
_export_star(require("./nestedObjectOrArraySchema/nestedObjectOrArraySchema"), exports);
_export_star(require("./plainObjectSchema/plainObjectSchema"), exports);
_export_star(require("./sharedSchema/sharedSchema"), exports);
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
