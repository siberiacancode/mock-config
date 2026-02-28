import type { Express } from 'express';
import type { Cors } from '../../../utils/types';
export declare const corsMiddleware: (server: Express, cors: Cors) => void;
