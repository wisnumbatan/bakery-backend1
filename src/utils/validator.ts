import { body, param, query } from 'express-validator';
import { UserRole } from '../types/user.types';

export const idValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const userCreateValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),

  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Invalid role')
];

export const addressValidator = [
  body('street')
    .trim()
    .notEmpty()
    .withMessage('Street is required'),

  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),

  body('postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),

  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
];