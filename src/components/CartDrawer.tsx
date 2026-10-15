import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Lock, LogIn } from 'lucide-react';
import { useCart } from '@/cart-context';
import { formatPrice } from '@/data';
import { useUser, useClerk } from '@/auth';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateCount, subtotal, totalItems } = useCart();
  const { isSignedIn } = useUser();
  const clerk = useClerk();

  const FREE_SHIPPING_THRESHOLD = 2000;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 80;
  const total = subtotal + shipping;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <>
      {/* Backdrop Scrim */}
      {open && (
        <div
          className="fixed inset-0 bg-brand-950/50 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-cream-50 shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-200/60 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-800">
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-950">Your Cart</h2>
              <p className="text-[11px] text-brand-500 font-medium">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-brand-700 hover:bg-brand-100 transition-colors"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-5 py-3 bg-brand-100/60 border-b border-brand-200/40">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-brand-900">
              {remainingForFreeShipping === 0 ? (
                <span className="text-forest-700 font-bold">🎉 Free Shipping Unlocked!</span>
              ) : (
                <>Add <strong className="text-brand-950">{formatPrice(remainingForFreeShipping)}</strong> for Free Delivery</>
              )}
            </span>
            <span className="text-[11px] text-brand-600 font-medium">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-brand-200/80 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                remainingForFreeShipping === 0 ? 'bg-forest-600' : 'bg-brand-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {!isSignedIn ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-100/80 border border-amber-200 text-amber-700 flex items-center justify-center mb-4 shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-950 mb-1.5">Sign In to View Cart</h3>
              <p className="text-xs sm:text-sm text-brand-600 max-w-xs mb-6 leading-relaxed">
                Please sign in with Google to add products to your cart and place orders.
              </p>
              <button
                onClick={() => {
                  onClose();
                  clerk?.openSignIn?.({ fallbackRedirectUrl: window.location.href });
                }}
                className="btn-primary text-xs sm:text-sm py-3 px-6 bg-brand-950 hover:bg-brand-900 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-full bg-brand-100/70 flex items-center justify-center mb-4 text-brand-400">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-950 mb-1">Your cart is empty</h3>
              <p className="text-xs sm:text-sm text-brand-600 max-w-xs mb-6">
                Discover our hand-picked Goan cashew collection and treat yourself to the freshest harvest.
              </p>
              <button onClick={onClose} className="btn-primary text-xs sm:text-sm py-3 px-6">
                Browse Collection
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 bg-white rounded-2xl p-3.5 border border-brand-200/70 shadow-sm"
              >
                <img
                  src={item.image}
                  alt={`${item.grade} ${item.type}`}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-brand-100"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-[10px] font-bold text-brand-600 tracking-wider uppercase block">
                        {item.grade}
                      </span>
                      <h4 className="font-serif text-sm font-bold text-brand-950 truncate">
                        {item.type} Cashews
                      </h4>
                      <p className="text-xs text-brand-500 font-medium">Pack: {item.quantity}</p>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-brand-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-100/70">
                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-cream-100/80 rounded-full px-2 py-0.5 border border-brand-200/80">
                      <button
                        onClick={() => updateCount(item.id, item.count - 1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-brand-800 hover:bg-white transition-colors"
                        aria-label="Decrease count"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-brand-950 w-5 text-center">
                        {item.count}
                      </span>
                      <button
                        onClick={() => updateCount(item.id, item.count + 1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-brand-800 hover:bg-white transition-colors"
                        aria-label="Increase count"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="font-serif text-sm sm:text-base font-bold text-brand-950">
                      {formatPrice(item.price * item.count)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Billing Breakdown */}
        {items.length > 0 && (
          <div className="border-t border-brand-200/70 p-5 bg-white shadow-luxury-lg">
            <div className="space-y-2 mb-4 text-xs sm:text-sm">
              <div className="flex justify-between text-brand-700 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-brand-950">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-700 font-medium">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-forest-700 font-bold">FREE</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-200/70 items-baseline">
                <div>
                  <span className="font-serif text-base font-bold text-brand-950 block">Grand Total</span>
                  <span className="text-[10px] text-brand-500">Taxes and packaging included</span>
                </div>
                <span className="font-serif text-2xl font-bold text-brand-950">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full btn-primary py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-md shadow-brand-900/20 group"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-brand-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Safe & Secure Cash on Delivery</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
