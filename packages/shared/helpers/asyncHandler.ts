import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler: (
  fn: (request: Request, response: Response, next: NextFunction) => Promise<any>
) => RequestHandler = (fn) => (request, response, next) =>
  Promise.resolve(fn(request, response, next)).catch(next);
