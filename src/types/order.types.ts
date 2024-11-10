import { Document } from 'mongoose';
import { IAddress, IAuditFields } from './common.types';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet'
}

export interface IOrderItem {
  product: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}

export interface IOrderDelivery {
  address: IAddress;
  instructions?: string;
  estimatedTime?: Date;
  actualDeliveryTime?: Date;
  trackingNumber?: string;
  deliveryFee: number;
}

export interface IOrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAmount?: number;
  paidAt?: Date;
  refundedAmount?: number;
  refundedAt?: Date;
  paymentIntentId?: string;
}

export interface IOrder extends IAuditFields {
  orderNumber: string;
  user: Document['_id'];
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  payment: IOrderPayment;
  delivery: IOrderDelivery;
  notes?: string;
  estimatedPreparationTime?: number;
  preparationStartedAt?: Date;
  preparationCompletedAt?: Date;
}

export interface IOrderMethods {
  calculateTotals(): void;
  generateOrderNumber(): string;
  canBeCancelled(): boolean;
  canBeRefunded(): boolean;
  getStatusHistory(): Array<{
    status: OrderStatus;
    timestamp: Date;
  }>;
}

export interface IOrderDocument extends IOrder, Document, IOrderMethods {}

export interface IOrderFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  user?: string;
}

export interface IOrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentMethod: Record<PaymentMethod, number>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface IOrderSearchParams {
  searchTerm?: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  phoneNumber?: string;
}

export type OrderUpdateData = Partial<
  Pick<IOrder, 'status' | 'notes' | 'estimatedPreparationTime'>
>;