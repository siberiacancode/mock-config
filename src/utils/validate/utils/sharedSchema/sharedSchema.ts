import { z } from 'zod';

export const stringForwardSlashSchema = z.templateLiteral(['/', z.string()]);

export const stringJsonFilenameSchema = z.templateLiteral([z.string(), '.json']);
