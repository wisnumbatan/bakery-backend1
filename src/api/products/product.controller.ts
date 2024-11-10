import { Request, Response } from 'express';
import ProductService from './product.service';
import { asyncHandler } from '../../utils/helpers';
import { IFilterOptions } from '../../types/common.types';
import logger from '../../utils/logger';

class ProductController {
  constructor(private productService: ProductService) {}

  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const imageUrls = files?.map(file => file.path);

    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const product = await this.productService.createProduct({
      ...req.body,
      imageUrl: imageUrls,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: product
    });
  });

  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const options: IFilterOptions = {
      search: req.query.search as string,
      category: req.query.category as string,
      minPrice: Number(req.query.minPrice),
      maxPrice: Number(req.query.maxPrice),
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sort: req.query.sort as string || '-createdAt'
    };

    const result = await this.productService.getProducts(options);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await this.productService.getProductById(req.params.id);

    res.status(200).json({
      success: true,
      data: product
    });
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const imageUrls = files?.map(file => file.path);

    const product = await this.productService.updateProduct(
      req.params.id,
      {
        ...req.body,
        ...(imageUrls && { imageUrl: imageUrls }),
        updatedBy: req.user?.id
      }
    );

    res.status(200).json({
      success: true,
      data: product
    });
  });

  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    await this.productService.deleteProduct(req.params.id, req.user.id);

    res.status(204).send();
  });

  updateStock = asyncHandler(async (req: Request, res: Response) => {
    const { quantity } = req.body;
    
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    const product = await this.productService.updateStock(
      req.params.id,
      quantity,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: product
    });
  });

  getBestSellers = asyncHandler(async (req: Request, res: Response) => {
    const products = await this.productService.getBestSellers();

    res.status(200).json({
      success: true,
      data: products
    });
  });

  getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const products = await this.productService.getProductsByCategory(
      req.params.categoryId
    );

    res.status(200).json({
      success: true,
      data: products
    });
  });
}

export default new ProductController(new ProductService());