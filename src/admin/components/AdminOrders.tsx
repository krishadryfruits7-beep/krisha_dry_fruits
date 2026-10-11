import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, X, Eye, MapPin, ExternalLink, Phone } from 'lucide-react';
import { adminApi } from '@/api';
import { formatPrice } from '@/data';
import { getCustomerOrders } from '@/orders-storage';

const STATUSES = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  confirmed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
  packed:    { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
  shipped:   { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  delivered: { bg: 'bg-forest-50 border-forest-200', text: 'text-forest-800', dot: 'bg-forest-500' },
  cancelled: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500' },
};

export default function AdminOrders({ onViewOrder }: { onViewOrder: (id: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.orders
      .list({ status, search, page })
      .then((data) => {
        const serverList = Array.isArray(data?.orders) ? data.orders : [];
        const local = getCustomerOrders();
        const map = new Map<string, any>();

        serverList.forEach((o: any) => {
          const id = o.orderId || o._id || o.id;
          if (id) map.set(id, o);
        });

        local.forEach((o: any) => {
          const id = o.orderId || o._id || o.id;
          if (id) {
            const existing = map.get(id) || {};
            map.set(id, { ...existing, ...o });
          }
        });

        let combined = Array.from(map.values()).sort((a, b) => {
          const da = new Date(a.createdAt || a.placedAt || 0).getTime();
          const db = new Date(b.createdAt || b.placedAt || 0).getTime();
          return db - da;
        });

        if (status && status !== 'all') {
          combined = combined.filter((o) => (o.status || 'pending').toLowerCase() === status.toLowerCase());
        }

        if (search) {
          const q = search.toLowerCase();
          combined = combined.filter(
            (o) =>
              o.orderId?.toLowerCase().includes(q) ||
              o.customer?.fullName?.toLowerCase().includes(q) ||
              o.customer?.phone?.includes(q) ||
              o.customer?.city?.toLowerCase().includes(q)
          );
        }

        const pageSize = 10;
        const total = combined.length;
        const totalP = Math.max(1, Math.ceil(total / pageSize));
        const paginated = combined.slice((page - 1) * pageSize, page * pageSize);

        setOrders(paginated);
        setTotalCount(total);
        setTotalPages(totalP);
      })
      .catch(() => {
        const local = getCustomerOrders();
        let combined = [...local].sort((a, b) => {
          const da = new Date(a.createdAt || a.placedAt || 0).getTime();
          const db = new Date(b.createdAt || b.placedAt || 0).getTime();
          return db - da;
        });

        if (status && status !== 'all') {
          combined = combined.filter((o) => (o.status || 'pending').toLowerCase() === status.toLowerCase());
        }

        if (search) {
          const q = search.toLowerCase();
          combined = combined.filter(
            (o) =>
              o.orderId?.toLowerCase().includes(q) ||
              o.customer?.fullName?.toLowerCase().includes(q) ||
              o.customer?.phone?.includes(q) ||
              o.customer?.city?.toLowerCase().includes(q)
          );
        }

        const pageSize = 10;
        const total = combined.length;
        const totalP = Math.max(1, Math.ceil(total / pageSize));
        const paginated = combined.slice((page - 1) * pageSize, page * pageSize);

        setOrders(paginated);
        setTotalCount(total);
        setTotalPages(totalP);
      })
      .finally(() => setLoading(false));
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleStatusChange = (s: string) => {
    setStatus(s);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950 tracking-tight">
            Customer Orders
          </h1>
          <p className="text-xs sm:text-sm text-brand-500 mt-1">
            Displaying {orders.length} of {totalCount} total processed orders.
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order ID, customer name, phone, city..."
            className="input-field pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white shadow-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <Filter className="w-4 h-4 text-brand-400 shrink-0 mr-1 hidden sm:block" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                status === s
                  ? 'bg-brand-800 text-cream-50 shadow-sm'
                  : 'bg-white text-brand-700 border border-brand-200/80 hover:border-brand-400 hover:bg-cream-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container: Mobile Cards (sm:hidden) + Desktop Table (hidden sm:block) */}
      <div className="card overflow-hidden border border-brand-200/70 bg-white shadow-luxury">
        
        {/* Mobile View: Clean Structured Cards */}
        <div className="sm:hidden divide-y divide-brand-100">
          {loading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-cream-200/60 rounded-2xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-500 font-medium">
              No orders match your filter criteria.
            </div>
          ) : (
            orders.map((order) => {
              const badge = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              const c = order.customer || {};
              const hasCoords = typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng);
              const gMapsQuery = hasCoords
                ? `${c.lat},${c.lng}`
                : `${c.doorNo ? c.doorNo + ' ' : ''}${c.address || ''} ${c.city || ''} ${c.state || ''} ${c.pincode || ''} India`;

              return (
                <div
                  key={order.orderId || order._id}
                  onClick={() => onViewOrder(order.orderId || order._id)}
                  className="p-4 hover:bg-cream-50/60 active:bg-cream-100/60 transition-colors space-y-3 cursor-pointer"
                >
                  {/* Top Bar: Order ID + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-brand-950 bg-brand-100/90 px-2.5 py-1 rounded-lg">
                      #{order.orderId}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${badge.bg} ${badge.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{order.status || 'pending'}</span>
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div>
                    <div className="font-bold text-brand-950 text-sm">
                      {order.customer?.fullName || 'Anonymous Customer'}
                    </div>
                    {order.customer?.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`tel:${order.customer.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-forest-700 hover:text-forest-900 font-semibold bg-forest-50 border border-forest-200 px-2 py-0.5 rounded-md"
                        >
                          <Phone className="w-3 h-3 text-forest-600" />
                          <span>{order.customer.phone}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Delivery Location & Google Maps */}
                  <div className="p-2.5 rounded-xl bg-cream-50/80 border border-brand-200/50 text-xs text-brand-700 space-y-1.5">
                    <div className="text-[11px] leading-relaxed line-clamp-2">
                      {c.doorNo ? `${c.doorNo}, ` : ''}{c.address ? `${c.address}, ` : ''}{c.city || 'India'}{c.pincode ? ` (${c.pincode})` : ''}
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-brand-100/80">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gMapsQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-800 hover:text-forest-950"
                      >
                        <MapPin className="w-3 h-3 text-forest-600" />
                        <span>{hasCoords ? 'Verified GPS Pin' : 'View on Google Maps'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>
                  </div>

                  {/* Bottom Row: Item count, Price, and Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-[11px] text-brand-500 font-medium">
                        {order.items?.length || 0} {(order.items?.length === 1 ? 'pack' : 'packs')} • {new Date(order.createdAt || order.placedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-base font-bold text-brand-950 font-serif">
                        {formatPrice(order.total)}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOrder(order.orderId || order._id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-cream-50 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-cream-100/60 text-xs font-bold text-brand-600 uppercase tracking-wider border-b border-brand-100">
                <th className="px-5 py-3.5">Order Ref</th>
                <th className="px-5 py-3.5">Customer & Contact</th>
                <th className="px-5 py-3.5 hidden sm:table-cell">Packs</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Fulfillment Status</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Created Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/60 font-medium">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-cream-200/80 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm text-brand-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const badge = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                  return (
                    <tr
                      key={order.orderId || order._id}
                      onClick={() => onViewOrder(order.orderId || order._id)}
                      className="hover:bg-cream-50/70 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-brand-900 bg-brand-100/70 px-2.5 py-1 rounded-md group-hover:bg-brand-800 group-hover:text-cream-50 transition-colors">
                          #{order.orderId}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-brand-950 text-sm">
                          {order.customer?.fullName || 'Anonymous Customer'}
                        </div>
                        <div className="text-xs text-brand-500 font-mono">
                          {order.customer?.phone}
                        </div>
                        {(() => {
                          const c = order.customer || {};
                          const hasCoords = typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng);
                          const gMapsQuery = hasCoords
                            ? `${c.lat},${c.lng}`
                            : `${c.doorNo ? c.doorNo + ' ' : ''}${c.address || ''} ${c.city || ''} ${c.state || ''} ${c.pincode || ''} India`;
                          return (
                            <div className="text-xs text-brand-700 font-medium max-w-xs mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">
                                {c.doorNo ? `${c.doorNo}, ` : ''}{c.address ? `${c.address}, ` : ''}{c.city || 'India'}{c.pincode ? ` (${c.pincode})` : ''}
                              </span>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gMapsQuery)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-forest-50 border border-forest-200 text-forest-800 hover:text-forest-950 hover:bg-forest-100 text-[10px] font-bold shrink-0 transition-colors"
                                title={hasCoords ? "Open exact verified GPS pin in Google Maps" : "Open shipping destination in Google Maps"}
                              >
                                <MapPin className="w-2.5 h-2.5 text-forest-700" />
                                <span>{hasCoords ? 'GPS Pin' : 'Map'}</span>
                                <ExternalLink className="w-2 h-2 text-forest-500" />
                              </a>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-5 py-4 text-xs text-brand-600 hidden sm:table-cell">
                        {order.items?.length || 0} {order.items?.length === 1 ? 'pack' : 'packs'}
                      </td>

                      <td className="px-5 py-4 font-bold text-brand-950 text-sm">
                        {formatPrice(order.total)}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize border ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{order.status || 'pending'}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-brand-500 font-normal hidden md:table-cell">
                        {new Date(order.createdAt || order.placedAt || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewOrder(order.orderId || order._id); }}
                          className="p-1.5 text-brand-500 hover:text-brand-950 hover:bg-brand-100 rounded-lg transition-colors"
                          title="View order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-brand-100 bg-cream-50/60">
            <span className="text-xs text-brand-600 font-medium">
              Page <strong className="text-brand-950">{page}</strong> of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-brand-200 bg-white hover:bg-cream-100 disabled:opacity-40 disabled:pointer-events-none transition-colors text-brand-800 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-brand-200 bg-white hover:bg-cream-100 disabled:opacity-40 disabled:pointer-events-none transition-colors text-brand-800 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
