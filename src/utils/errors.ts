import { Request, Response } from 'express';
import UserService from '../api/users/user.service';
import { asyncHandler } from '.././utils/helpers';
import { IFilterOptions } from '.././types/common.types';

export class BaseError extends Error {
  constructor(public message: string, public statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  public errors?: any[];
  
  constructor(message: string, errors?: any[]) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Not authorized') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}
