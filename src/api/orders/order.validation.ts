import { body, param } from 'express-validator';

export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.product')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('deliveryAddress')
    .isObject()
    .withMessage('Delivery address is required'),
  
  body('deliveryAddress.street')
    .notEmpty()
    .withMessage('Street is required'),
  
  body('deliveryAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  
  body('deliveryAddress.state')
    .notEmpty()
    .withMessage('State is required'),
  
  body('deliveryAddress.postalCode')
    .notEmpty()
    .withMessage('Postal code is required')
];

export const updateOrderStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('status')
    .isIn(['pending', 'processing', 'completed', 'cancelled'])
    .withMessage('Invalid order status')
];