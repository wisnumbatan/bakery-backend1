import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ValidationError } from './errors';
import { IPagination } from '../types/common.types';
import nodemailer from 'nodemailer';
import fs from 'fs';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const generateHash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const generateRandomToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const createPagination = (
  page: number = 1,
  limit: number = 10,
  total: number
): IPagination => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

export const parseQueryParams = (query: any) => {
  return {
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 10,
    sort: query.sort || '-createdAt',
    search: query.search || '',
    filters: query.filters ? JSON.parse(query.filters) : {}
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): void => {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/;
  if (!passwordRegex.test(password)) {
    throw new ValidationError(
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    );
  }
};

export const formatResponse = (
  success: boolean,
  data?: any,
  message?: string,
  pagination?: IPagination
) => {
  return {
    success,
    ...(message && { message }),
    ...(data && { data }),
    ...(pagination && { pagination })
  };
};

export const sendEmail = async (options: {
  to: string;
  subject: string;
  template: string;
  context: any;
}): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const emailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: fs.readFileSync(`${__dirname}/../templates/${options.template}.html`, 'utf-8')
  };

  transporter.sendMail(emailOptions);
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error: any) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};