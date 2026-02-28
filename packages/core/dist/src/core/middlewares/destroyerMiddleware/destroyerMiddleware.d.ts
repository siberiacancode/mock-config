import type { Server } from 'node:http';
type ServerWithDestroyer = Server & {
    destroy: Server['close'];
};
export declare const destroyerMiddleware: (server: Server) => ServerWithDestroyer;
export {};
