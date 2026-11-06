import { Home, Grid, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { useCart } from '@/cart-context';
import { useCustomerOrders, isOrderActive } from '@/orders-storage';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenCart: () => void;
  onOpenCategories?: () => void;
}

export default function MobileBottomNav({
  currentPage,
  onNavigate,
  onOpenCart,
  onOpenCategories,
}: MobileBottomNavProps) {
  const { totalItems } = useCart();
  const customerOrders = useCustomerOrders();
  const activeOrdersCount = customerOrders.filter(isOrderActive).length;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-brand-200/70 shadow-[0_-4px_20px_rgba(40,20,10,0.06)] px-2 py-1.5 safe-area-bottom"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentPage === 'home'
              ? 'text-brand-900 font-bold'
              : 'text-brand-600/80 hover:text-brand-950 font-medium'
          }`}
          aria-label="Home"
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${currentPage === 'home' ? 'stroke-[2.2] text-brand-900' : 'stroke-[1.7]'}`} />
            {currentPage === 'home' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        {/* 2. Shop All */}
        <button
          onClick={() => onNavigate('products')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentPage === 'products'
              ? 'text-brand-900 font-bold'
              : 'text-brand-600/80 hover:text-brand-950 font-medium'
          }`}
          aria-label="Shop All Dry Fruits"
        >
          <div className="relative">
            <Grid className={`w-5 h-5 ${currentPage === 'products' ? 'stroke-[2.2] text-brand-900' : 'stroke-[1.7]'}`} />
            {currentPage === 'products' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Shop All</span>
        </button>

        {/* 3. Categories / Harvests Guide */}
        <button
          onClick={() => {
            if (onOpenCategories) onOpenCategories();
            else onNavigate('grades');
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentPage === 'grades'
              ? 'text-brand-900 font-bold'
              : 'text-brand-600/80 hover:text-brand-950 font-medium'
          }`}
          aria-label="Categories & Guides"
        >
          <div className="relative">
            <Sparkles className={`w-5 h-5 ${currentPage === 'grades' ? 'stroke-[2.2] text-brand-900' : 'stroke-[1.7]'}`} />
            {currentPage === 'grades' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Guide</span>
        </button>

        {/* 4. Orders Tracker */}
        <button
          onClick={() => onNavigate('myorders')}
          className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentPage === 'myorders'
              ? 'text-brand-900 font-bold'
              : 'text-brand-600/80 hover:text-brand-950 font-medium'
          }`}
          aria-label="Track My Orders"
        >
          <div className="relative">
            <Package className={`w-5 h-5 ${currentPage === 'myorders' ? 'stroke-[2.2] text-brand-900' : 'stroke-[1.7]'}`} />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-amber-600 text-white flex items-center justify-center shadow-xs">
                {activeOrdersCount}
              </span>
            )}
            {currentPage === 'myorders' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Orders</span>
        </button>

        {/* 5. Cart Drawer Trigger */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center py-1 rounded-xl transition-all text-brand-900"
          aria-label="View Shopping Cart"
        >
          <div className="relative">
            <div className={`p-1 rounded-full ${totalItems > 0 ? 'bg-brand-100/80' : ''}`}>
              <ShoppingBag className="w-5 h-5 stroke-[1.9] text-brand-900" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-brand-600 text-cream-50 flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight font-bold text-brand-900 mt-0.5">Cart</span>
        </button>
      </div>
    </nav>
  );
}

