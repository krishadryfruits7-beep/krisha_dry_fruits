import mongoose, { Schema, Document } from 'mongoose';

export interface IVariantPrice {
  quantity: string;
  price: number;
}

export interface IGradeType {
  type: string;
  description: string;
  image: string;
  prices: IVariantPrice[];
}

export interface IProduct extends Document {
  grade: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  origin: string;
  gradeDescription: string;
  image: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  badge: string;
  types: IGradeType[];
  active: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const VariantPriceSchema = new Schema<IVariantPrice>({
  quantity: { type: String, required: true },
  price: { type: Number, required: true },
});

const GradeTypeSchema = new Schema<IGradeType>({
  type: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  prices: [VariantPriceSchema],
});

const ProductSchema = new Schema<IProduct>(
  {
    grade: { type: String, required: true },
    name: { type: String, required: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    origin: { type: String, default: 'Goa Coastal Belt, India' },
    gradeDescription: { type: String, default: '' },
    image: { type: String, required: true },
    gallery: [{ type: String }],
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    badge: { type: String, default: 'Premium' },
    types: [GradeTypeSchema],
    active: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
