import { body, param, query } from 'express-validator';
import { UserRole } from '../../types/user.types';

export const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Invalid role')
];

export const updateUserValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Invalid role'),

  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage('Invalid phone number format'),

  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),

  body('address.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street is required'),

  body('address.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('address.state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State is required'),

  body('address.postalCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),

  body('address.country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country is required')
];

export const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character')
];