import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteContentDoc extends Document {
  key: string;
  announcement: string;
  hero: Record<string, any>;
  heroSlides?: Array<Record<string, any>>;
  features: Array<Record<string, any>>;
  locationBanners: Array<Record<string, any>>;
  contact: Record<string, any>;
  social: Record<string, any>;
  footerBio: string;
  adminEmails?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SiteContentSchema = new Schema(
  {
    key: { type: String, default: 'current', unique: true, index: true },
    announcement: { type: String, default: '' },
    hero: { type: Schema.Types.Mixed, default: {} },
    heroSlides: [{ type: Schema.Types.Mixed }],
    features: [{ type: Schema.Types.Mixed }],
    locationBanners: [{ type: Schema.Types.Mixed }],
    contact: { type: Schema.Types.Mixed, default: {} },
    social: { type: Schema.Types.Mixed, default: {} },
    footerBio: { type: String, default: '' },
    adminEmails: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.SiteContent || mongoose.model<ISiteContentDoc>('SiteContent', SiteContentSchema);
