import { useEffect, useState } from 'react';
import { ShoppingBag, Truck, CheckCircle, IndianRupee, Clock, ArrowRight, Package, TrendingUp, MapPin } from 'lucide-react';
import { adminApi } from '@/api';
import { formatPrice } from '@/data';
import { getCustomerOrders } from '@/orders-storage';
import type { AdminPage } from '../AdminApp';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  confirmed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
  packed:    { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
  shipped:   { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  delivered: { bg: 'bg-forest-50 border-forest-200', text: 'text-forest-800', dot: 'bg-forest-500' },
  cancelled: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500' },
};

export default function AdminDashboard({ onNavigate }: { onNavigate: (p: AdminPage, id?: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.orders.stats().catch(() => null),
      adminApi.orders.list({ page: 1 }).catch(() => null),
    ])
      .then(([serverStats, serverOrdersRes]) => {
        const local = getCustomerOrders();
        const map = new Map<string, any>();

        // 1. Ingest server orders if available
        if (serverOrdersRes && Array.isArray(serverOrdersRes.orders)) {
          serverOrdersRes.orders.forEach((o: any) => {
            const id = o.orderId || o._id || o.id;
            if (id) map.set(id, o);
          });
        }

        // 2. Ingest local orders (takes precedence or augments)
        local.forEach((o: any) => {
          const id = o.orderId || o._id || o.id;
          if (id) {
            const existing = map.get(id) || {};
            map.set(id, { ...existing, ...o });
          }
        });

        const allOrders = Array.from(map.values()).sort((a, b) => {
          const da = new Date(a.createdAt || a.placedAt || 0).getTime();
          const db = new Date(b.createdAt || b.placedAt || 0).getTime();
          return db - da;
        });

        // Compute real, accurate metrics from the actual order dataset
        const totalOrders = allOrders.length;
        const pendingOrders = allOrders.filter(
          (o) => !o.status || o.status === 'pending' || o.status === 'confirmed'
        ).length;
        const shippedOrders = allOrders.filter((o) => o.status === 'shipped' || o.status === 'packed').length;
        const deliveredOrders = allOrders.filter((o) => o.status === 'delivered').length;
        const totalRevenue = allOrders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        setStats({
          totalOrders,
          pendingOrders,
          shippedOrders,
          deliveredOrders,
          totalRevenue,
        });

        setRecentOrders(allOrders.slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Total Orders',
          value: stats.totalOrders,
          subtext: 'Lifetime orders placed',
          icon: ShoppingBag,
          color: 'from-brand-700 to-brand-800 text-cream-50',
          badge: 'All Time',
        },
        {
          label: 'Pending Fulfillment',
          value: stats.pendingOrders,
          subtext: 'Awaiting dispatch',
          icon: Clock,
          color: 'from-amber-600 to-amber-700 text-cream-50',
          badge: 'Action Needed',
        },
        {
          label: 'In Transit / Shipped',
          value: stats.shippedOrders,
          subtext: 'Out with couriers',
          icon: Truck,
          color: 'from-indigo-600 to-indigo-700 text-cream-50',
          badge: 'Live',
        },
        {
          label: 'Delivered',
          value: stats.deliveredOrders,
          subtext: 'Successful handoffs',
          icon: CheckCircle,
          color: 'from-forest-600 to-forest-700 text-cream-50',
          badge: 'Completed',
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-brand-600 mt-1">
            Real-time harvest orders, revenue pipeline, and dispatch status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('products')}
            className="btn-outline py-2.5 px-4 text-xs font-semibold"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Manage Catalog</span>
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="btn-primary py-2.5 px-4 text-xs font-semibold"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>All Orders</span>
          </button>
        </div>
      </div>

      {/* Revenue Highlight Card */}
      {stats && (
        <div className="rounded-3xl bg-gradient-to-r from-brand-950 via-brand-900 to-brand-950 text-cream-50 p-6 sm:p-8 shadow-luxury-xl border border-brand-800/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-400" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-300">
                  Gross Realized Revenue
                </span>
              </div>
              <div className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-cream-50">
                {formatPrice(stats.totalRevenue)}
              </div>
              <p className="text-xs text-cream-300/80 mt-2 font-medium">
                Accumulated across {stats.totalOrders} total verified customer transactions.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-cream-100">
                  <TrendingUp className="w-4 h-4 text-gold-400" />
                  <span>100% Cash-on-Delivery</span>
                </div>
                <div className="text-[11px] text-cream-400 mt-0.5">Air & Ground Logistics</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Metric Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 h-32 animate-pulse bg-cream-200/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="card p-5 sm:p-6 bg-white border border-brand-200/70 shadow-luxury hover:shadow-luxury-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${s.color} flex items-center justify-center shadow-md`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cream-100 text-brand-700 border border-brand-200/60">
                  {s.badge}
                </span>
              </div>

              <div className="text-xs font-semibold text-brand-500 mb-1">{s.label}</div>
              <div className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 mb-1">{s.value}</div>
              <div className="text-[11px] text-brand-400">{s.subtext}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders Section: Mobile Cards (sm:hidden) + Desktop Table (hidden sm:block) */}
      <div className="card overflow-hidden border border-brand-200/70 bg-white shadow-luxury">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-brand-100">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-brand-950">Recent Customer Orders</h2>
            <p className="text-xs text-brand-500">Tap any order to inspect items or manage fulfillment.</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-950 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile View: Compact clean cards */}
        <div className="sm:hidden divide-y divide-brand-100">
          {recentOrders.length === 0 && !loading && (
            <div className="p-8 text-center text-xs text-brand-500">
              No orders registered in the system yet.
            </div>
          )}
          {recentOrders.map((order) => {
            const badge = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
            const c = order.customer || {};
            const hasCoords = typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng);
            const mapQuery = hasCoords
              ? `${c.lat},${c.lng}`
              : `${c.doorNo ? c.doorNo + ' ' : ''}${c.address || ''} ${c.city || ''} ${c.state || ''} ${c.pincode || ''} India`;

            return (
              <div
                key={order.orderId || order._id}
                onClick={() => onNavigate('order-detail', order.orderId || order._id)}
                className="p-4 hover:bg-cream-50/70 active:bg-cream-100/70 cursor-pointer space-y-2.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-brand-900 bg-brand-100/80 px-2 py-0.5 rounded-md">
                    #{order.orderId}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${badge.bg} ${badge.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{order.status || 'pending'}</span>
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-brand-950 text-sm">{order.customer?.fullName || 'Customer'}</div>
                    <div className="text-[11px] text-brand-500 mt-0.5">
                      {c.city || 'India'} • {order.items?.length || 1} items
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif font-bold text-sm text-brand-950">
                      {formatPrice(order.total)}
                    </div>
                    <div className="text-[10px] text-brand-400">
                      {new Date(order.createdAt || order.placedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-brand-100/70 text-[11px]">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-forest-700 hover:text-forest-900 font-semibold"
                  >
                    <MapPin className="w-3 h-3 text-forest-600" />
                    <span>{hasCoords ? 'Verified GPS' : 'View on Maps'}</span>
                  </a>
                  <span className="text-brand-600 font-bold flex items-center gap-1">
                    <span>Manage Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-cream-100/60 text-xs font-bold text-brand-600 uppercase tracking-wider border-b border-brand-100">
                <th className="px-6 py-3.5">Order Ref</th>
                <th className="px-6 py-3.5">Customer Dossier</th>
                <th className="px-6 py-3.5 hidden sm:table-cell">Grand Total</th>
                <th className="px-6 py-3.5">Fulfillment Status</th>
                <th className="px-6 py-3.5 hidden md:table-cell">Placed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/60 font-medium">
              {recentOrders.map((order) => {
                const badge = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                return (
                  <tr
                    key={order.orderId || order._id}
                    onClick={() => onNavigate('order-detail', order.orderId || order._id)}
                    className="hover:bg-cream-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-brand-900 bg-brand-100/60 px-2 py-1 rounded-md group-hover:bg-brand-700 group-hover:text-cream-50 transition-colors">
                        #{order.orderId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-950 text-sm">{order.customer?.fullName || 'Customer'}</div>
                      {(() => {
                        const c = order.customer || {};
                        const hasCoords = typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng);
                        const mapQuery = hasCoords
                          ? `${c.lat},${c.lng}`
                          : `${c.doorNo ? c.doorNo + ' ' : ''}${c.address || ''} ${c.city || ''} ${c.state || ''} ${c.pincode || ''} India`;
                        return (
                          <div className="text-xs text-brand-500 font-normal flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>{c.city || 'India'}{c.pincode ? ` (${c.pincode})` : ''} • {order.items?.length || 1} items</span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-forest-50 border border-forest-200 text-forest-700 hover:text-forest-900 text-[10px] font-bold shrink-0"
                              title={hasCoords ? "Open exact verified GPS pin in Google Maps" : "Open address in Google Maps"}
                            >
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{hasCoords ? 'GPS Pin' : 'Map'}</span>
                            </a>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-950 hidden sm:table-cell">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize border ${badge.bg} ${badge.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{order.status || 'pending'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-500 font-normal hidden md:table-cell">
                      {new Date(order.createdAt || order.placedAt || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-500">
                    No orders registered in the system yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
