export type StandardCashewGrade = 'W180' | 'W210' | 'W240' | 'W320' | 'W450';
export type CashewGrade = string;

export type ProductCategory =
  | 'all'
  | 'cashews'
  | 'almonds'
  | 'walnuts'
  | 'pistachios'
  | 'dates'
  | 'figs'
  | 'raisins'
  | 'berries-seeds'
  | 'gift-boxes'
  | string;

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  hindiName?: string;
  tagline: string;
  description: string;
  icon: string;
  image: string;
  badge?: string;
  itemCount?: number;
}

export type CashewType =
  | 'Raw'
  | 'Roasted'
  | 'Roasted & Salted'
  | 'Fried & Salted'
  | 'Pepper Spiced'
  | 'Honey Glazed'
  | 'Smoked'
  | 'Lightly Salted'
  | 'Natural Whole'
  | 'In-Shell'
  | 'Unsalted Kernels'
  | 'Garland Strung'
  | 'Medjool King'
  | 'Ajwa Holy'
  | 'Assorted 4-in-1'
  | 'Assorted 6-in-1'
  | string;

export type Quantity = '250g' | '500g' | '1kg' | '2kg' | '5kg' | 'Box of 1' | 'Box of 2' | string;

export interface VariantPrice {
  quantity: Quantity;
  price: number;
}

export interface GradeType {
  type: CashewType;
  description: string;
  image: string;
  prices: VariantPrice[];
}

export interface Product {
  _id?: string;
  id: string;
  category?: ProductCategory;
  categoryLabel?: string;
  grade: CashewGrade;
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
  active?: boolean;
  priority?: number;
  healthBenefits?: string[];
  nutritionalHighlights?: {
    calories?: string;
    protein?: string;
    fiber?: string;
    healthyFats?: string;
    keyNutrient?: string;
  };
  types: GradeType[];
  createdAt?: string | Date;
}

export interface CartItem {
  id: string;
  productId: string;
  grade: CashewGrade;
  category?: ProductCategory;
  type: CashewType;
  quantity: Quantity;
  price: number;
  image: string;
  count: number;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  doorNo?: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  lat?: number;
  lng?: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | string;

export interface OrderDetails {
  _id?: string;
  orderId: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: CustomerInfo;
  paymentMethod: string;
  placedAt: string;
  estimatedDelivery: string;
  deliveryDistanceKm?: number;
  deliveryExplanation?: string;
  status?: OrderStatus;
  trackingNumber?: string;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
