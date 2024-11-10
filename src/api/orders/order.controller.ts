import { Response } from 'express';
import { Request } from 'express-serve-static-core';
import OrderService from './order.service';
import { asyncHandler } from '../../utils/helpers';
import { IFilterOptions } from '../../types/common.types';

class OrderController {
  constructor(private orderService: OrderService) {}

  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await this.orderService.createOrder({
      ...req.body,
      user: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: order
    });
  });

  getOrders = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as { id: string; role: string } | undefined;
    const options: IFilterOptions = {
      filter: user?.role === 'admin'
        ? {}
        : { user: user?.id },
      sort: 'createdAt:-1',
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      populate: ['user', 'items.product']
    };

    const result = await this.orderService.getOrders(options);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const order = await this.orderService.getOrderById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      data: order
    });
  });

  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const order = await this.orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user
    );

    res.status(200).json({
      success: true,
      data: order
    });
  });

  cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    await this.orderService.cancelOrder(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  });

  getOrderStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.orderService.getOrderStats(req.user);

    res.status(200).json({
      success: true,
      data: stats
    });
  });
}

export default new OrderController(new OrderService());