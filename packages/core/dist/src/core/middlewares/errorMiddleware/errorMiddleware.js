"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "errorMiddleware", {
    enumerable: true,
    get: function() {
        return errorMiddleware;
    }
});
const _ansicolors = /*#__PURE__*/ _interop_require_default(require("ansi-colors"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const errorMiddleware = (server)=>{
    server.use((error, request, response, next)=>{
        console.error(_ansicolors.default.bgRed(`\nError on ${request.method} ${request.url} request\n`));
        var _error_message;
        const message = `Message: ${(_error_message = error.message) !== null && _error_message !== void 0 ? _error_message : 'Internal server error'}\n\n${error.stack}`;
        response.status(error.status || 500).send(message);
        // ✅ important:
        // call next function for trigger default express error handling behavior
        next(error);
    });
};
