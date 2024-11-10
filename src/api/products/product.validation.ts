import { body, param, query } from 'express-validator';

export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),

  body('ingredients')
    .isArray()
    .withMessage('Ingredients must be an array')
    .notEmpty()
    .withMessage('At least one ingredient is required'),

  body('nutrition')
    .isObject()
    .withMessage('Nutrition information is required')
    .custom((value) => {
      const required = ['calories', 'protein', 'carbohydrates', 'fat'];
      return required.every(field => 
        typeof value[field] === 'number' && value[field] >= 0
      );
    })
    .withMessage('Invalid nutrition information')
];

export const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required')
];

export const getProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be non-negative'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be non-negative')
    .custom((value, { req }) => {
      return !(req.query?.minPrice) || Number(value) >= Number(req.query?.minPrice);
    })
    .withMessage('Maximum price must be greater than minimum price')
];

export const updateStockValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('quantity')
    .isInt()
    .withMessage('Quantity must be an integer')
];