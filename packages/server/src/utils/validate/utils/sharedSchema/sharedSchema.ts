import { z } from 'zod';

export const stringForwardSlashSchema = z.string().startsWith('/');

export const stringJsonFilenameSchema = z.string().endsWith('.json');
