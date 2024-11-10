import { Router } from 'express';
import userController from './user.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  getUsersValidation,
  updateUserValidation,
  updatePasswordValidation
} from './user.validation';

const router = Router();

// Protected routes - all user routes require authentication
router.use(protect);

// Profile routes - available to all authenticated users
router.get('/profile', userController.getProfile);
router.patch(
  '/profile',
  validate(updateUserValidation),
  userController.updateProfile
);
router.patch(
  '/password',
  validate(updatePasswordValidation),
  userController.updatePassword
);

// Admin only routes
router.use(restrictTo('admin'));

router.get(
  '/',
  validate(getUsersValidation),
  userController.getAllUsers
);

router.get('/stats', userController.getUserStats);

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(validate(updateUserValidation), userController.updateUser)
  .delete(userController.deleteUser);

export default router;