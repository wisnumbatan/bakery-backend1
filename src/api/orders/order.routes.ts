import { Router } from 'express';
import orderController from './order.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createOrderValidation, updateOrderStatusValidation } from './order.validation';

const router = Router();

// Apply authentication for all order routes
router.use(protect);

router.route('/')
  .post(validate(createOrderValidation), orderController.createOrder)
  .get(orderController.getOrders);

router.get('/stats', orderController.getOrderStats);

router.route('/:id')
  .get(orderController.getOrderById)
  .patch(
    restrictTo('admin'),
    validate(updateOrderStatusValidation),
    orderController.updateOrderStatus
  );

router.post('/:id/cancel', orderController.cancelOrder);

export default router;