import { IAddress, IAuditFields } from './common.types';

export interface IUser extends IAuditFields {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber?: string;
  address?: IAddress;
  isActive: boolean;
  lastLogin?: Date;
  isEmailVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  lockUntil?: Date;
  loginAttempts: number;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  USER = 'user'
}

export interface IUserUpdate {
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: Partial<IAddress>;
  isActive?: boolean;
  role?: UserRole;
}
export interface IPublicUser {
  name: string;
  email: string;
  role: string;
  lastLogin?: Date;
  isEmailVerified: boolean;
}