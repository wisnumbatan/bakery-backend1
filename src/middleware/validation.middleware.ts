import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map(err => ({
        message: err.msg
      }));

      throw new ValidationError('Validation failed', validationErrors);
    }

    next();
  };
};

export const sanitize = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body[field]) {
      req.body[field] = req.body[field]
        .trim()
        .replace(/[<>]/g, '')  // Basic XSS prevention
        .normalize(); // Unicode normalization
    }
    next();
  };
};