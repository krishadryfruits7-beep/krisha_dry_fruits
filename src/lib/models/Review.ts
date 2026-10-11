import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  name: string;
  location: string;
  gradeBought: string;
  rating: number;
  text: string;
  verified: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true },
    location: { type: String, default: 'India' },
    gradeBought: { type: String, default: 'W180 Jumbo King' },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    text: { type: String, required: true },
    verified: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
