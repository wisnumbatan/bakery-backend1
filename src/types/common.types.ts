export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: IPagination;
  errors?: IValidationError[];
}

export interface IValidationError {
  field: string;
  message: string;
  value?: any;

}

export interface IQueryOptions {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  populate?: string | string[];
  select?: string | string[];
  filter?: Record<string, any>;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IAuditFields {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
export interface IFilterOptions {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  filter?: Record<string, any>;

  populate?: string[];
}
export interface IServiceResponse<T = any> {
  success: boolean;
  data: T;
  pagination?: {

    page: number;

    limit: number;

    total: number;
    totalPages: number;

    pages: number;

  code: number;
  message: string;
}}
