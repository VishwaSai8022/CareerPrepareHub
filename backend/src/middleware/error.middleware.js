import logger from '../logger/index.js';

export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = Boolean(err.statusCode && statusCode < 500);
  const isDev = process.env.NODE_ENV !== 'production';
  const message = isOperational ? err.message : (isDev ? err.message : 'Internal server error');

  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn({ message: err.message, code: err.code, details: err.details });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_ERROR',
    ...(err.details ? { details: err.details } : {}),
    ...(isDev && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
