export type StandardCashewGrade = 'W180' | 'W210' | 'W240' | 'W320' | 'W450';
export type CashewGrade = string;

export type CashewType =
  | 'Raw'
  | 'Roasted'
  | 'Roasted & Salted'
  | 'Fried & Salted'
  | 'Pepper Spiced'
  | 'Honey Glazed'
  | string;

export type Quantity = '250g' | '500g' | '1kg' | '2kg' | '5kg' | string;

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
  types: GradeType[];
}

export interface CartItem {
  id: string;
  productId: string;
  grade: CashewGrade;
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
  status?: OrderStatus;
  trackingNumber?: string;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
