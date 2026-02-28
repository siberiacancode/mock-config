import type { NextFunction, Request, RequestHandler, Response } from 'express';
export declare const asyncHandler: (fn: (request: Request, response: Response, next: NextFunction) => Promise<any>) => RequestHandler;
