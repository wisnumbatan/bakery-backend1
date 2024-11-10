import { Router } from 'express';
import { authController } from './auth.controller';
import { protect } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from './auth.validation';

const router = Router();

// Public routes
router.post(
  '/register',
  validate(registerValidation),
  authController.register
);

router.post(
  '/login',
  validate(loginValidation),
  authController.login
);

router.post(
  '/forgot-password',
  validate(forgotPasswordValidation),
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  validate(resetPasswordValidation),
  authController.resetPassword
);

router.get(
  '/verify-email/:token',
  authController.verifyEmail
);

// Protected routes
router.use(protect);

router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

export default router;