import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from 'dotenv';
import User from '../../models/user.model';
import { AuthenticationError, ValidationError } from '../../utils/errors';
import { sendEmail } from '../../utils/helpers';
import logger from '../../config/logger';
import { IAuthResponse, ILoginRequest, IRegisterRequest } from '../../types/auth.types';

// Load environment variables
config();

// Generate secret if not exists
const generateSecret = () => crypto.randomBytes(32).toString('hex');

export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpire: string;
  private readonly refreshExpire: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || generateSecret();
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || generateSecret();
    this.accessExpire = process.env.JWT_ACCESS_EXPIRE || '15m';
    this.refreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

    // Update env vars if secrets were generated
    if (!process.env.JWT_ACCESS_SECRET) {
      process.env.JWT_ACCESS_SECRET = this.accessSecret;
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      process.env.JWT_REFRESH_SECRET = this.refreshSecret;
    }

    logger.info('JWT configuration initialized');
  }

  private generateTokens(userId: string): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { id: userId },
      this.accessSecret,
      { expiresIn: this.accessExpire }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      this.refreshSecret,
      { expiresIn: this.refreshExpire }
    );

    return { accessToken, refreshToken };
  }

  async register(userData: IRegisterRequest): Promise<IAuthResponse> {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new ValidationError('Email already registered');
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      const user = await User.create({
        ...userData,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const tokens = this.generateTokens(user.id);

      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        template: 'emailVerification',
        context: {
          name: user.name,
          url: `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`
        }
      });

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(credentials: ILoginRequest): Promise<IAuthResponse> {
    try {
      const user = await User.findOne({ email: credentials.email })
        .select('+password')
        .select('+loginAttempts')
        .select('+lockUntil');

      if (!user || !(await user.comparePassword(credentials.password))) {
        await this.handleFailedLogin(user);
        throw new AuthenticationError('Invalid credentials');
      }

      if (!user.isEmailVerified) {
        throw new ValidationError('Please verify your email first');
      }

      if (user.lockUntil && user.lockUntil > new Date()) {
        throw new AuthenticationError('Account is temporarily locked. Try again later');
      }

      const tokens = this.generateTokens(user.id);

      // Reset login attempts and update last login
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  private async handleFailedLogin(user: any): Promise<void> {
    if (!user) return;

    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }

    await user.save();
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new ValidationError('Invalid or expired verification token');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      logger.info(`Email verified for user: ${user.email}`);
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new ValidationError('User not found with this email');
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await user.save();

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        template: 'passwordReset',
        context: {
          name: user.name,
          url: resetUrl
        }
      });

      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new ValidationError('Invalid or expired reset token');
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      if (!refreshToken) {
        throw new AuthenticationError('Refresh token is required');
      }
  
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as { id: string };
      
      // Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new AuthenticationError('User no longer exists');
      }
  
      // Generate new access token
      const accessToken = jwt.sign(
        { id: decoded.id },
        this.accessSecret,
        { expiresIn: this.accessExpire }
      );
  
      logger.info(`Access token refreshed for user: ${user.email}`);
      return { accessToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new AuthenticationError('Invalid refresh token');
    }
  }
}



export const authService = new AuthService();