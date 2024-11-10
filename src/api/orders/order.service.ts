import { Types } from 'mongoose';
import { OrderStatus } from '../../types/order.types'; // Adjust the import path as necessary
import Order from '../../models/order.model';
import Product from '../../models/product.model';
import { NotFoundError, ValidationError, AuthenticationError } from '../../utils/errors';
import { IFilterOptions, IServiceResponse } from '../../types/common.types';

class OrderService {
  async createOrder(orderData: any): Promise<any> {
    // Validate products stock and calculate total
    const itemsWithDetails = await Promise.all(
      orderData.items.map(async (item: any) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new ValidationError(`Product ${item.product} not found`);
        }
        if (product.stock < item.quantity) {
          throw new ValidationError(`Insufficient stock for ${product.name}`);
        }
        return {
          ...item,
          price: product.price,
          total: product.price * item.quantity
        };
      })
    );

    const totalAmount = itemsWithDetails.reduce((sum: number, item: any) => sum + item.total, 0);

    // Create order
    const order = await Order.create({
      ...orderData,
      items: itemsWithDetails,
      totalAmount
    });

    // Update product stock
    await Promise.all(
      order.items.map(async (item: any) => {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      })
    );

    return order.populate(['user', 'items.product']);
  }

  async getOrders(options: IFilterOptions): Promise<IServiceResponse<any>> {
    const total = await Order.countDocuments(options.filter);
    const totalPages = Math.ceil(total / (options.limit || 10));

    const orders = await Order.find(options.filter || {})
      .sort(options.sort)
      .skip(((options.page || 1) - 1) * (options.limit || 10))
      .limit(options.limit || 10)
      .populate(options.populate || []);

    return {
      success: true,
      data: orders,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        total,
        totalPages,
        pages: totalPages,
        code: 200,
        message: 'Success'
      }
    };
  }

  async getOrderById(orderId: string, user: any): Promise<any> {
    const order = await Order.findById(orderId).populate(['user', 'items.product']);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (user.role !== 'admin' && order.user?.toString() !== user.id) {
      throw new AuthenticationError('Not authorized to access this order');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, user: any): Promise<any> {
    if (user.role !== 'admin') {
      throw new AuthenticationError('Not authorized to update order status');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    order.status = status;
    await order.save();

    return order.populate(['user', 'items.product']);
  }

  async cancelOrder(orderId: string, user: any): Promise<void> {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (user.role !== 'admin' && order.user?.toString() !== user.id) {
      throw new AuthenticationError('Not authorized to cancel this order');
    }

    if (order.status !== 'pending') {
      throw new ValidationError('Only pending orders can be cancelled');
    }

    // Restore product stock
    await Promise.all(
      order.items.map(async (item: any) => {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      })
    );

    order.status = OrderStatus.CANCELLED;
    await order.save();
  }

  async getOrderStats(user: any): Promise<any> {
    const match = user.role === 'admin' ? {} : { user: new Types.ObjectId(user.id) };

    return Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
  }
}

export default OrderService;