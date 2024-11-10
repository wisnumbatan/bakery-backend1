import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/errors';
import User from '../models/user.model';
import logger from '../utils/logger';
import { redisClient } from '../config/redis';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer') ? authHeader.split(' ')[1] : null;

    if (!token) {
      throw new AuthenticationError('Please authenticate');
    }

    // 2. Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`bl_${token}`);
    if (isBlacklisted) {
      throw new AuthenticationError('Token is no longer valid');
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    // 4. Check user existence
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AuthenticationError('User no longer exists');
    }

    // 5. Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('User account is disabled');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      throw new AuthenticationError('Not authorized to access this route');
    }
    next();
  };
};