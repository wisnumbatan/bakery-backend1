import mongoose, { Document, Schema } from 'mongoose';
import { 
  IOrder,
  IOrderDocument,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  IOrderItem
} from '../types/order.types';

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true
  },
  notes: String
}, { _id: false });

const addressSchema = new Schema({
  street: { type: String, required: [true, 'Street is required'] },
  city: { type: String, required: [true, 'City is required'] },
  state: { type: String, required: [true, 'State is required'] },
  postalCode: { type: String, required: [true, 'Postal code is required'] },
  country: { type: String, required: [true, 'Country is required'] }
}, { _id: false });

const orderPaymentSchema = new Schema({
  method: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  transactionId: String,
  paidAmount: Number,
  paidAt: Date,
  refundedAmount: Number,
  refundedAt: Date
}, { _id: false });

const orderDeliverySchema = new Schema({
  address: {
    type: addressSchema,
    required: true
  },
  instructions: String,
  estimatedTime: Date,
  actualDeliveryTime: Date,
  trackingNumber: String,
  deliveryFee: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

const orderSchema = new Schema<IOrderDocument>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Items are required'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return Array.isArray(items) && items.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  payment: {
    type: orderPaymentSchema,
    required: true
  },
  delivery: {
    type: orderDeliverySchema,
    required: true
  },
  notes: String,
  estimatedPreparationTime: Number,
  preparationStartedAt: Date,
  preparationCompletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ 'delivery.estimatedTime': 1 });

// Methods
orderSchema.methods.calculateTotals = function(): void {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum: number, item: IOrderItem): number => {
    item.subtotal = item.price * item.quantity;
    return sum + item.subtotal;
  }, 0);

  // Calculate tax (assuming 10%)
  this.tax = this.subtotal * 0.1;

  // Calculate total
  this.totalAmount = this.subtotal + this.tax + this.deliveryFee - (this.discount || 0);
};

orderSchema.methods.generateOrderNumber = function(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
};

// Middlewares
orderSchema.pre('save', function(this: IOrderDocument, next) {
  if (this.isNew) {
    this.orderNumber = this.generateOrderNumber();
  }
  
  if (this.isModified('items')) {
    this.calculateTotals();
  }
  next();
});

const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
export default Order;