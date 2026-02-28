"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "destroyerMiddleware", {
    enumerable: true,
    get: function() {
        return destroyerMiddleware;
    }
});
const destroyerMiddleware = (server)=>{
    const serverWithDestroyer = server;
    const connections = {};
    serverWithDestroyer.on('connection', (connection)=>{
        const key = `${connection.remoteAddress}:${connection.remotePort}`;
        connections[key] = connection;
        connection.on('close', ()=>{
            delete connections[key];
        });
    });
    serverWithDestroyer.destroy = (callback)=>{
        serverWithDestroyer.close(callback);
        Object.values(connections).forEach((connection)=>{
            connection.destroy();
        });
        return serverWithDestroyer;
    };
    return serverWithDestroyer;
};
