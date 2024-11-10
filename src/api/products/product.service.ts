import { Types } from 'mongoose';
import Product from '../../models/product.model';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { IFilterOptions } from '../../types/common.types';
import { IProduct, IServiceResponse } from '../../types/product.types';
import { deleteFile } from '../../utils/helpers';
import logger from '../../utils/logger';

class ProductService {
  async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
    try {
      const product = await Product.create(productData);
      await product.populate('category');
      
      logger.info(`Product created: ${product.name}`);
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  async getProducts(options: IFilterOptions): Promise<IServiceResponse<IProduct[]>> {
    try {
      const filter: any = {};

      if (options.search) {
        filter.$or = [
          { name: { $regex: options.search, $options: 'i' } },
          { description: { $regex: options.search, $options: 'i' } }
        ];
      }

      if (options.category) {
        filter.category = options.category;
      }

      if (options.minPrice || options.maxPrice) {
        filter.price = {};
        if (options.minPrice) filter.price.$gte = options.minPrice;
        if (options.maxPrice) filter.price.$lte = options.maxPrice;
      }

      const sortQuery = options.sort?.split(',').reduce((acc, sort) => {
        const [field, order] = sort.startsWith('-') ? 
          [sort.slice(1), -1] : [sort, 1];
        return { ...acc, [field]: order };
      }, {});

      const total = await Product.countDocuments(filter);
      const products = await Product.find(filter)
        .populate('category')
        .sort(sortQuery)
        .skip(((options.page || 1) - 1) * (options.limit || 10))
        .limit(options.limit || 10);

      return {
        success: true,
        message: 'Products fetched successfully',
        data: products,
        pagination: {
          total,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(total / (options.limit || 10))
        }
      };
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(productId: string): Promise<IProduct> {
    const product = await Product.findById(productId).populate('category');
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async updateProduct(productId: string, updateData: Partial<IProduct>): Promise<IProduct> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Delete old images if new ones are uploaded
    if (updateData.imageUrl && product.imageUrl) {
      await Promise.all(product.imageUrl.map(url => deleteFile(url)));
    }

    Object.assign(product, updateData);
    await product.save();
    await product.populate('category');

    logger.info(`Product updated: ${product.name}`);
    return product;
  }

  async deleteProduct(productId: string, userId: string): Promise<void> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Delete product images
    if (product.imageUrl) {
      await Promise.all(product.imageUrl.map(url => deleteFile(url)));
    }

    await product.deleteOne();
    logger.info(`Product deleted: ${product.name} by user: ${userId}`);
  }

  async updateStock(productId: string, quantity: number, userId: string): Promise<IProduct> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock + quantity < 0) {
      throw new ValidationError('Insufficient stock');
    }

    product.stock += quantity;
    if (product.stock === 0) {
      product.isAvailable = false;
    }

    await product.save();
    logger.info(`Stock updated for product: ${product.name} by user: ${userId}`);
    return product;
  }

  async getBestSellers(): Promise<IProduct[]> {
    return Product.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orderItems'
        }
      },
      {
        $addFields: {
          totalOrdered: {
            $sum: '$orderItems.items.quantity'
          }
        }
      },
      {
        $sort: { totalOrdered: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      }
    ]);
  }

  async getProductsByCategory(categoryId: string): Promise<IProduct[]> {
    return Product.find({ 
      category: categoryId,
      isAvailable: true 
    }).populate('category');
  }
}

export default ProductService;