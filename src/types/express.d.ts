// src/types/express.d.ts
import { Document } from 'mongoose';
import IUser from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: typeof IUser & Document;
      token?: string;
    }
  }
}

// Ensure this file is treated as a module
export {};