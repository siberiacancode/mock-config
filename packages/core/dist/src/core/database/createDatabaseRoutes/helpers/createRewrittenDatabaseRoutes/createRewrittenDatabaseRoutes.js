"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createRewrittenDatabaseRoutes", {
    enumerable: true,
    get: function() {
        return createRewrittenDatabaseRoutes;
    }
});
const _expressurlrewrite = /*#__PURE__*/ _interop_require_default(require("express-urlrewrite"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const createRewrittenDatabaseRoutes = (router, rewrittenRoutes)=>Object.entries(rewrittenRoutes).forEach(([key, value])=>{
        router.use((0, _expressurlrewrite.default)(key, value));
    });
