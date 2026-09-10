import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.details || null,
      ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
    });
  }

  // Handle Prisma Known Errors (like unique constraint violation)
  if ((err as any).code === 'P2002') {
    const target = (err as any).meta?.target || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`,
      errors: null,
    });
  }

  console.error('Unhandled Error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: config.nodeEnv === 'development' ? err.message : null,
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
};
