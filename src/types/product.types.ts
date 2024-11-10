import { IAuditFields } from './common.types';

export interface IProduct extends IAuditFields {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string[];
  ingredients: string[];
  allergens?: string[];
  nutrition: INutrition;
  stock: number;
  isAvailable: boolean;
  preparationTime: number;
}

export interface INutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface IProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  allergens?: string[];
  search?: string;
}
export interface IServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  pagination?: {
    total: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}