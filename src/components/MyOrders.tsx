import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, XCircle, Search, MapPin, ChevronDown, ChevronUp, ShoppingBag, ShieldCheck, Loader2 } from 'lucide-react';
import { useUser, useClerk } from '@/auth';
import { api } from '@/api';
import { formatPrice } from '@/data';
import { useCustomerOrders, updateCustomerOrderStatus, saveCustomerOrder } from '@/orders-storage';
import type { OrderDetails } from '@/types';

interface MyOrdersProps {
  onBack: () => void;
  onShop?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; step: number }> = {
  pending:   { label: 'Order Received', icon: Clock,        color: 'text-amber-700 bg-amber-50 border-amber-200', step: 1 },
  confirmed: { label: 'Confirmed',      icon: Package,      color: 'text-blue-700 bg-blue-50 border-blue-200',   step: 2 },
  packed:    { label: 'Artisanal Packed', icon: Package,    color: 'text-indigo-700 bg-indigo-50 border-indigo-200', step: 3 },
  shipped:   { label: 'In Transit',     icon: Truck,        color: 'text-purple-700 bg-purple-50 border-purple-200', step: 4 },
  delivered: { label: 'Delivered',      icon: CheckCircle2, color: 'text-forest-700 bg-forest-50 border-forest-200', step: 5 },
  cancelled: { label: 'Cancelled',      icon: XCircle,      color: 'text-red-700 bg-red-50 border-red-200',       step: 0 },
  canceled:  { label: 'Cancelled',      icon: XCircle,      color: 'text-red-700 bg-red-50 border-red-200',       step: 0 },
};

const ORDER_STEPS = ['Received', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

export default function MyOrders({ onBack, onShop }: MyOrdersProps) {
  const { isSignedIn, user } = useUser();
  const clerk = useClerk();
  const localOrders = useCustomerOrders();
  const [serverOrders, setServerOrders] = useState<any[]>([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Sync server orders if user is signed in
  useEffect(() => {
    if (!isSignedIn || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    setLoadingServer(true);
    api.orders.listByUser(email)
      .then((res: any) => {
        if (Array.isArray(res?.orders)) {
          setServerOrders(res.orders);
          // Sync any status updates back to localStorage immediately
          res.orders.forEach((so: any) => {
            const id = so.orderId || so._id;
            if (id && so.status) {
              updateCustomerOrderStatus(id, so.status, so.trackingNumber, so.notes);
            }
          });
        }
      })
      .catch(() => {
        // Fallback to localOrders
      })
      .finally(() => setLoadingServer(false));
  }, [isSignedIn, user]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) return;
    setCancellingId(orderId);
    try {
      try {
        await api.orders.cancel(orderId, 'Cancelled by customer');
      } catch (err) {
        console.warn('Backend cancel failed, updating locally:', err);
      }
      updateCustomerOrderStatus(orderId, 'cancelled');
      setServerOrders((prev) =>
        prev.map((o) => (o.orderId === orderId || o._id === orderId ? { ...o, status: 'cancelled' } : o))
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleLookupOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchFilter.trim();
    if (!q) return;

    setLookingUp(true);
    setLookupError(null);
    try {
      if (q.includes('@')) {
        const res = await api.orders.listByUser(q);
        if (Array.isArray(res?.orders) && res.orders.length > 0) {
          setServerOrders((prev) => {
            const map = new Map<string, any>();
            [...prev, ...res.orders].forEach((o: any) => {
              const id = o.orderId || o._id;
              if (id) map.set(id, o);
            });
            return Array.from(map.values());
          });
          res.orders.forEach((o: any) => saveCustomerOrder(o));
          setExpandedId(res.orders[0].orderId || res.orders[0]._id);
          return;
        }
      } else {
        const res = await api.orders.get(q);
        if (res && (res.orderId || res._id)) {
          setServerOrders((prev) => {
            const map = new Map<string, any>();
            [...prev, res].forEach((o: any) => {
              const id = o.orderId || o._id;
              if (id) map.set(id, o);
            });
            return Array.from(map.values());
          });
          saveCustomerOrder(res);
          setExpandedId(res.orderId || res._id);
          return;
        }
      }
      setLookupError(`No order found matching "${q}". Please check the Order ID or email.`);
    } catch {
      setLookupError(`Could not find an order matching "${q}". Please check the order number.`);
    } finally {
      setLookingUp(false);
    }
  };

  // Combine and deduplicate orders by orderId
  const allOrders = (() => {
    const map = new Map<string, any>();

    // Add local orders first
    localOrders.forEach((o) => {
      if (o.orderId) map.set(o.orderId, o);
    });

    // Merge server orders (server may have updated status/tracking)
    serverOrders.forEach((so) => {
      const id = so.orderId || so._id;
      if (id) {
        const existing = map.get(id) || {};
        map.set(id, { ...existing, ...so });
      }
    });

    return Array.from(map.values());
  })();

  // Filter orders by search query
  const filteredOrders = searchFilter.trim()
    ? allOrders.filter((o) => {
        const query = searchFilter.toLowerCase().trim();
        return (
          o.orderId?.toLowerCase().includes(query) ||
          o.customer?.fullName?.toLowerCase().includes(query) ||
          o.customer?.phone?.includes(query) ||
          o.items?.some((it: any) =>
            it.grade?.toLowerCase().includes(query) ||
            it.type?.toLowerCase().includes(query)
          )
        );
      })
    : allOrders;

  // Auto-expand first order
  useEffect(() => {
    if (filteredOrders.length > 0 && !expandedId) {
      setExpandedId(filteredOrders[0].orderId || filteredOrders[0]._id);
    }
  }, [filteredOrders, expandedId]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-700 hover:text-brand-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </button>

        {!isSignedIn && (
          <button
            onClick={() => clerk?.openSignIn?.({ fallbackRedirectUrl: window.location.href })}
            className="text-xs font-semibold text-brand-700 hover:text-brand-950 bg-cream-200/70 hover:bg-cream-300/80 px-3 py-1.5 rounded-full border border-brand-200 transition-colors"
          >
            Sign In to Sync Orders
          </button>
        )}
      </div>

      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 tracking-tight">
            My Orders & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-brand-600 mt-1">
            Real-time status, artisanal packaging, and dispatch tracking for your cashews.
          </p>
        </div>

        <form onSubmit={handleLookupOrder} className="relative w-full sm:w-72 flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search or enter Order ID..."
              className="w-full text-xs rounded-full border border-brand-200 bg-white pl-8 pr-3 py-2 text-brand-950 placeholder-brand-400 focus:outline-none focus:border-brand-600"
            />
            <Search className="w-3.5 h-3.5 text-brand-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          {searchFilter.trim() && (
            <button
              type="submit"
              disabled={lookingUp}
              className="px-3 py-2 rounded-full bg-brand-950 hover:bg-brand-900 text-cream-50 text-xs font-semibold shrink-0 disabled:opacity-50 flex items-center gap-1"
            >
              {lookingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Track</span>}
            </button>
          )}
        </form>
      </div>

      {/* Guest Sync Banner if not signed in */}
      {!isSignedIn && allOrders.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Orders placed in this browser are securely saved locally. Sign in with Google to access them on any device.</span>
          </div>
          <button
            onClick={() => clerk?.openSignIn?.({ fallbackRedirectUrl: window.location.href })}
            className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="card p-8 sm:p-12 text-center max-w-lg mx-auto shadow-luxury border border-brand-200/60">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-100/70 text-brand-600 flex items-center justify-center">
            <Package className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="font-serif text-xl font-bold text-brand-950 mb-2">
            {searchFilter ? 'Order Not in Browser Cache' : 'Track Your Order or Browse Catalog'}
          </h2>
          <p className="text-xs sm:text-sm text-brand-600 mb-6 leading-relaxed">
            {searchFilter
              ? `No local order matching "${searchFilter}". You can search our live database directly:`
              : 'Have an Order ID or want to look up an order placed on another phone or computer? Enter it below:'}
          </p>

          {/* Direct Live Lookup */}
          <form onSubmit={handleLookupOrder} className="flex gap-2 max-w-md mx-auto mb-5">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Enter Order ID (e.g. KDF123456) or Email"
              className="flex-1 text-xs rounded-full border border-brand-200 bg-white px-4 py-2.5 text-brand-950 placeholder-brand-400 focus:outline-none focus:border-brand-600"
            />
            <button
              type="submit"
              disabled={lookingUp || !searchFilter.trim()}
              className="btn-primary py-2.5 px-5 text-xs font-semibold rounded-full disabled:opacity-50 flex items-center gap-1.5"
            >
              {lookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{lookingUp ? 'Tracking...' : 'Track'}</span>
            </button>
          </form>

          {lookupError && (
            <p className="text-xs text-red-600 font-medium mb-5 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {lookupError}
            </p>
          )}

          <button
            onClick={onShop || onBack}
            className="btn-secondary py-2.5 px-6 text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shop Premium Cashews</span>
          </button>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-5">
        {filteredOrders.map((order) => {
          const statusKey = order.status?.toLowerCase() || 'confirmed';
          const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.confirmed;
          const StatusIcon = cfg.icon;
          const orderIdentifier = order.orderId || order._id;
          const isExpanded = expandedId === orderIdentifier;

          return (
            <div
              key={orderIdentifier}
              className="card overflow-hidden border border-brand-200/80 shadow-luxury transition-all"
            >
              {/* Order Card Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : orderIdentifier)}
                className="p-5 sm:p-6 bg-white hover:bg-cream-50/50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-100"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-brand-100/80 text-brand-800 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base sm:text-lg font-bold text-brand-950">
                        Order #{order.orderId || order._id}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </span>
                    </div>
                    <div className="text-xs text-brand-500 mt-0.5">
                      Placed on {order.placedAt || 'Recently'} • {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-brand-400">Total Amount</div>
                    <div className="font-serif text-base sm:text-lg font-bold text-brand-950">
                      {formatPrice(order.total || 0)}
                    </div>
                  </div>

                  <button className="p-1 rounded-full text-brand-400 hover:text-brand-900 transition-colors">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details Body */}
              {isExpanded && (
                <div className="p-5 sm:p-6 bg-cream-50/30 space-y-6 animate-fade-in">
                  {/* Visual Fulfillment Step Tracker or Cancellation Card */}
                  {order.status === 'cancelled' || order.status === 'canceled' ? (
                    <div className="bg-red-50/90 rounded-2xl p-4 sm:p-5 border border-red-200/80 shadow-sm flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-serif text-sm sm:text-base font-bold text-red-950">
                          Order #{orderIdentifier} is Cancelled
                        </h4>
                        <p className="text-xs text-red-800/90 mt-1 leading-relaxed">
                          {order.notes || 'This order was cancelled and will not be prepared or dispatched. No payment was captured.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-200/60 shadow-sm space-y-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider font-bold text-brand-400 mb-3">
                          Order Progress
                        </div>
                        <div className="grid grid-cols-5 gap-1 sm:gap-2">
                          {ORDER_STEPS.map((stepName, idx) => {
                            const stepNumber = idx + 1;
                            const isCompleted = cfg.step >= stepNumber;
                            const isCurrent = cfg.step === stepNumber;

                            return (
                              <div key={stepName} className="flex flex-col items-center text-center">
                                <div
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    isCompleted
                                      ? 'bg-forest-600 text-white shadow-sm'
                                      : 'bg-brand-100 text-brand-400'
                                  } ${isCurrent ? 'ring-4 ring-forest-500/20' : ''}`}
                                >
                                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
                                </div>
                                <span
                                  className={`text-[9.5px] sm:text-xs font-semibold mt-1.5 ${
                                    isCompleted ? 'text-brand-950' : 'text-brand-400'
                                  }`}
                                >
                                  {stepName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {order.trackingNumber && (
                        <div className="pt-3 border-t border-brand-100 flex items-center justify-between text-xs">
                          <span className="text-brand-600">Air Express Tracking:</span>
                          <span className="font-mono font-bold text-brand-950 bg-cream-100 px-2.5 py-1 rounded-lg">
                            {order.trackingNumber}
                          </span>
                        </div>
                      )}

                      {/* Customer Cancel Button for pending / confirmed orders */}
                      {(order.status === 'pending' || order.status === 'confirmed' || !order.status) && (
                        <div className="pt-3 border-t border-brand-100 flex items-center justify-between">
                          <span className="text-xs text-brand-500">Need to cancel this order?</span>
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(orderIdentifier)}
                            disabled={cancellingId === orderIdentifier}
                            className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            {cancellingId === orderIdentifier ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items Breakdown */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-500">
                      Ordered Cashews
                    </div>
                    <div className="divide-y divide-brand-100 rounded-2xl bg-white border border-brand-200/70 p-4">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className={`flex items-center gap-3.5 ${i > 0 ? 'pt-3 mt-3' : ''}`}>
                          <img
                            src={item.image || '/cashew_single_nut.jpg'}
                            alt={item.grade}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-cream-50 shrink-0 border border-brand-100"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              (e.currentTarget as HTMLImageElement).src = '/cashew_single_nut.jpg';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-serif text-sm sm:text-base font-bold text-brand-950 leading-tight">
                              {item.grade} {item.type} Cashews
                            </div>
                            <div className="text-xs text-brand-500 mt-0.5">
                              Pack: <span className="font-semibold text-brand-700">{item.quantity}</span> × {item.count} unit{item.count > 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-sm sm:text-base font-bold text-brand-950 shrink-0">
                            {formatPrice((item.price || 0) * (item.count || 1))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address & Cost Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Delivery Address */}
                    <div className="rounded-2xl bg-white border border-brand-200/70 p-4 space-y-1.5 text-xs">
                      <div className="font-bold text-brand-900 flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-600" />
                        <span>Shipping Address</span>
                      </div>
                      <p className="font-semibold text-brand-950">{order.customer?.fullName}</p>
                      <p className="text-brand-600">{order.customer?.address}</p>
                      <p className="text-brand-600">
                        {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}
                      </p>
                      <p className="text-brand-500 pt-1">Phone: {order.customer?.phone}</p>
                    </div>

                    {/* Price Breakdown */}
                    <div className="rounded-2xl bg-white border border-brand-200/70 p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-brand-600">
                        <span>Items Subtotal</span>
                        <span>{formatPrice(order.subtotal || order.total || 0)}</span>
                      </div>
                      <div className="flex justify-between text-brand-600">
                        <span>Pan-India Delivery</span>
                        <span>
                          {order.shipping === 0 ? (
                            <span className="text-forest-700 font-bold">Free</span>
                          ) : (
                            formatPrice(order.shipping || 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-brand-600">
                        <span>Payment Method</span>
                        <span className="font-medium capitalize">{order.paymentMethod || 'COD / Online'}</span>
                      </div>
                      <div className="border-t border-brand-100 pt-2 flex justify-between font-bold text-sm sm:text-base text-brand-950">
                        <span>Total Paid</span>
                        <span>{formatPrice(order.total || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
