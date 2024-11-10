import User from '../../models/user.model';
import { NotFoundError, ValidationError, AuthenticationError } from '../../utils/errors';
import { IFilterOptions, IServiceResponse } from '../../types/common.types';
import { IUser, IUserUpdate } from '../../types/user.types';
import logger from '../../utils/logger';

class UserService {
  async getAllUsers(options: IFilterOptions): Promise<IServiceResponse<IUser[]>> {
    try {
      const filter: any = {};

      if (options.search) {
        filter.$or = [
          { name: { $regex: options.search, $options: 'i' } },
          { email: { $regex: options.search, $options: 'i' } }
        ];
      }

      if (options.role) {
        filter.role = options.role;
      }

      if (typeof options.isActive === 'boolean') {
        filter.isActive = options.isActive;
      }

      const sortQuery = options.sort?.split(',').reduce((acc, sort) => {
        const [field, order] = sort.startsWith('-') ? 
          [sort.slice(1), -1] : [sort, 1];
        return { ...acc, [field]: order };
      }, {});

      const total = await User.countDocuments(filter);
      const users = await User.find(filter)
        .select('-password')
        .sort(sortQuery)
        .skip(((options.page ?? 1) - 1) * (options.limit ?? 10))
        .limit(options.limit ?? 10);

      return {
        success: true,
        data: users,
        pagination: {
          total,
          page: options.page ?? 1,
          limit: options.limit ?? 10,
          pages: Math.ceil(total / (options.limit ?? 10)),
          totalPages: Math.ceil(total / (options.limit ?? 10)),
          code: 200,
          message: 'Success'
        }
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateUser(userId: string, updateData: IUserUpdate, currentUser: any): Promise<IUser> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Only admins can update roles and active status
    if (currentUser.role !== 'admin') {
      delete updateData.role;
      delete updateData.isActive;
    }

    // Prevent email duplication
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        throw new ValidationError('Email already in use');
      }
    }

    Object.assign(user, updateData);
    await user.save();

    logger.info(`User updated: ${user.email} by ${currentUser.email}`);
    return user;
  }

  async deleteUser(userId: string, currentUser: any): Promise<void> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'admin' && currentUser.role !== 'admin') {
      throw new AuthenticationError('Not authorized to delete admin users');
    }

    await user.deleteOne();
    logger.info(`User deleted: ${user.email} by ${currentUser.email}`);
  }

  async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
    // Prevent sensitive fields update
    delete updateData.role;
    delete updateData.isActive;
    delete updateData.password;

    const user = await this.updateUser(userId, updateData, { role: 'user' });
    return user;
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!(await user.comparePassword(currentPassword))) {
      throw new ValidationError('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password updated for user: ${user.email}`);
  }

  async getUserStats(): Promise<any> {
    return User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          active: 1,
          inactive: { $subtract: ['$count', '$active'] }
        }
      }
    ]);
  }
}

export default UserService;