import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../types/product.types';

const nutritionSchema = new Schema({
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbohydrates: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: Number,
  sugar: Number
}, { _id: false });

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: Schema.Types.String,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  imageUrl: [{
    type: String,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Please provide valid URLs for images'
    }
  }],
  ingredients: [{
    type: String,
    required: true
  }],
  allergens: [{
    type: String,
    enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'fish', 'shellfish']
  }],
  nutrition: {
    type: nutritionSchema,
    required: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    required: true,
    min: [0, 'Preparation time cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isAvailable: 1 });

// Virtual field for average rating (to be populated from reviews)
productSchema.virtual('averageRating', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  options: { match: { isApproved: true } }
});

// Stock management middleware
productSchema.pre('save', function(this: IProduct, next) {
  if (this.stock === 0) {
    this.isAvailable = false;
  }
  next();
});

export default mongoose.model<IProduct>('Product', productSchema);