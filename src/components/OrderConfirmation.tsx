import { CheckCircle, MapPin, ArrowRight, Package } from 'lucide-react';
import type { OrderDetails } from '@/types';
import { formatPrice } from '@/data';

interface OrderConfirmationProps {
  order: OrderDetails;
  onContinueShopping: () => void;
  onViewOrders?: () => void;
}

export default function OrderConfirmation({ order, onContinueShopping, onViewOrders }: OrderConfirmationProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-12 h-12 text-forest-600" />
        </div>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-brand-950 mb-3">Order Confirmed!</h1>
        <p className="text-brand-600 max-w-md mx-auto">
          Thank you for your order. We've received it and will dispatch your freshly packed premium cashews shortly.
        </p>
      </div>

      {/* Order ID & delivery estimate */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="card p-5 border border-brand-200/60 shadow-sm">
          <div className="text-xs text-brand-500 mb-1">Order Number</div>
          <div className="font-serif text-xl font-bold text-brand-900">{order.orderId}</div>
        </div>
        <div className="card p-5 border border-brand-200/60 shadow-sm">
          <div className="text-xs text-brand-500 mb-1">Estimated Dispatch</div>
          <div className="font-serif text-base font-semibold text-brand-900">{order.estimatedDelivery || 'Within 24–48 Hours'}</div>
        </div>
      </div>

      {/* Order items */}
      <div className="card p-6 mb-8 border border-brand-200/60 shadow-luxury">
        <h2 className="font-serif text-lg font-semibold text-brand-900 mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={item.id || (item as any)._id || idx} className="flex gap-3.5 items-center">
              <img
                src={item.image || '/cashew_single_nut.jpg'}
                alt={item.grade}
                className="w-14 h-14 rounded-xl object-cover bg-cream-50 border border-brand-100"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/cashew_single_nut.jpg';
                }}
              />
              <div className="flex-1">
                <div className="text-sm font-bold text-brand-900">{item.grade} {item.type}</div>
                <div className="text-xs text-brand-500">{item.quantity} · Qty {item.count}</div>
              </div>
              <div className="text-sm font-semibold text-brand-900">{formatPrice(item.price * item.count)}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-brand-100 mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-brand-600">Subtotal</span>
            <span className="font-medium text-brand-900">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-600">Shipping</span>
            <span className="font-medium text-brand-900">
              {order.shipping === 0 ? <span className="text-forest-600 font-bold">Free Pan-India</span> : formatPrice(order.shipping)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-600">Payment</span>
            <span className="font-medium text-brand-900 capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-brand-200">
            <span className="font-serif text-base font-semibold text-brand-900">Total</span>
            <span className="font-serif text-xl font-bold text-brand-900">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="card p-6 mb-8 border border-brand-200/60 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-brand-900 mb-4">Delivery Address</h2>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
          <div className="text-sm text-brand-700 leading-relaxed">
            <div className="font-semibold text-brand-900">{order.customer.fullName}</div>
            <div>{order.customer.address}</div>
            <div>{order.customer.city}, {order.customer.state} — {order.customer.pincode}</div>
            <div className="mt-1 text-brand-500">Phone: {order.customer.phone} · Email: {order.customer.email}</div>
            {typeof order.customer.lat === 'number' && typeof order.customer.lng === 'number' && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-forest-700 bg-forest-50 px-2.5 py-1 rounded-md border border-forest-200">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
                <span>Verified GPS Pin: {order.customer.lat.toFixed(4)}, {order.customer.lng.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onViewOrders && (
          <button
            onClick={onViewOrders}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-cream-200 hover:bg-cream-300 text-brand-900 border border-brand-300 px-6 py-3.5 text-sm font-semibold transition-all shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span>Track in My Orders</span>
          </button>
        )}

        <button
          onClick={onContinueShopping}
          className="w-full sm:w-auto btn-primary group px-8"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
