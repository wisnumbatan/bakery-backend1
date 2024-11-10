import { Router } from 'express';
import productController from './product.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { uploadMultiple } from '../../middleware/upload.middleware';
import {
  createProductValidation,
  updateProductValidation,
  getProductsValidation,
  updateStockValidation
} from './product.validation';

const router = Router();

// Public routes
router.get(
  '/',
  validate(getProductsValidation),
  productController.getProducts
);

router.get('/best-sellers', productController.getBestSellers);
router.get('/:id', productController.getProductById);
router.get('/category/:categoryId', productController.getProductsByCategory);

// Protected routes
router.use(protect);
router.use(restrictTo('admin'));

router.post(
  '/',
  uploadMultiple('images', 5),
  validate(createProductValidation),
  productController.createProduct
);

router.patch(
  '/:id',
  uploadMultiple('images', 5),
  validate(updateProductValidation),
  productController.updateProduct
);

router.delete('/:id', productController.deleteProduct);

router.patch(
  '/:id/stock',
  validate(updateStockValidation),
  productController.updateStock
);

export default router;