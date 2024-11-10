import { Request, Response } from 'express';
import UserService from './user.service';
import { asyncHandler } from '../../utils/helpers';
import { IFilterOptions } from '../../types/common.types';
import logger from '../../utils/logger';

class UserController {
  constructor(private userService: UserService) {}

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const options: IFilterOptions = {
      search: req.query.search as string,
      role: req.query.role as string,
      isActive: req.query.isActive === 'true',
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sort: req.query.sort as string || '-createdAt'
    };

    const result = await this.userService.getAllUsers(options);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.getUserById(req.params.id);

    res.status(200).json({
      success: true,
      data: user
    });
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.updateUser(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      data: user
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.deleteUser(req.params.id, req.user);

    res.status(204).send();
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const user = await this.userService.getUserById((req.user as { _id: string })._id);

    res.status(200).json({
      success: true,
      data: user
    });
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const user = await this.userService.updateProfile(req.user.id, req.body);

    res.status(200).json({
      success: true,
      data: user
    });
  });

  updatePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    await this.userService.updatePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  });

  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.userService.getUserStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  });
}

export default new UserController(new UserService());