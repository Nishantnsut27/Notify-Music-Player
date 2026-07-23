import { Request, Response, NextFunction } from 'express';

export function errorHandlerMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[BackendServerError]', err.name, err.message);

  res.status(500).json({
    success: false,
    error: 'An internal server error occurred while processing your request.'
  });
}
