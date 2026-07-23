import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().trim().min(1, 'Search query parameter cannot be empty.').max(100, 'Search query parameter too long.'),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const idParamSchema = z.object({
  id: z.string().trim().min(1, 'Resource ID parameter is required.').max(128, 'Resource ID parameter too long.').regex(/^[a-zA-Z0-9_\-:]+$/, 'Invalid resource ID characters.')
});

export function validateSearchQuery(req: Request, res: Response, next: NextFunction): void {
  const queryParam = (req.query.q || req.query.query || '').toString();
  const limitParam = (req.query.limit || '20').toString();

  const result = searchSchema.safeParse({ query: queryParam, limit: limitParam });

  if (!result.success) {
    res.status(400).json({
      success: false,
      data: [],
      error: result.error.issues[0]?.message || 'Invalid search parameters.'
    });
    return;
  }

  req.query.q = result.data.query;
  req.query.limit = result.data.limit.toString();
  next();
}

export function validateIdParameter(req: Request, res: Response, next: NextFunction): void {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = idParamSchema.safeParse({ id: rawId });

  if (!result.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: result.error.issues[0]?.message || 'Invalid ID parameter.'
    });
    return;
  }

  req.params.id = result.data.id;
  next();
}
