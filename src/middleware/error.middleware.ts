import { Request, Response, NextFunction } from 'express';
import { MongoError } from 'mongodb';
import mongoose from 'mongoose';
import { BaseError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

interface ErrorResponse {
  success: boolean;
  message: string;
  stack?: string;
  errors?: any[];
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    error: err,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  let response: ErrorResponse = {
    success: false,
    message: 'Internal server error'
  };

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    response = {
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }))
    };
    res.status(400).json(response);
    return;
  }

  // Mongoose duplicate key error
  if (err instanceof MongoError && err.code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    response = {
      success: false,
      message: `Duplicate field: ${field}. Please use another value.`
    };
    res.status(400).json(response);
    return;
  }

  // Custom errors
  if (err instanceof BaseError) {
    response = {
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    response = {
      success: false,
      message: 'Invalid token. Please log in again.'
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    response = {
      success: false,
      message: 'Token expired. Please log in again.'
    };
    res.status(401).json(response);
    return;
  }

  // Default error
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};