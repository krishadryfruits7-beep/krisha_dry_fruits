import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Save,
  Copy,
  Check,
  ExternalLink,
  Navigation,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { adminApi, api } from '@/api';
import { formatPrice } from '@/data';
import { getCustomerOrders, updateCustomerOrderStatus } from '@/orders-storage';

const STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
  confirmed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
  packed:    { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800' },
  shipped:   { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800' },
  delivered: { bg: 'bg-forest-50 border-forest-200', text: 'text-forest-800' },
  cancelled: { bg: 'bg-red-50 border-red-200', text: 'text-red-800' },
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  packed: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const TIMELINE = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

export default function AdminOrderDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi.orders.get(orderId)
      .then((o) => {
        if (!o) throw new Error('Not found');
        setOrder(o);
        setStatus(o.status || 'pending');
        setTracking(o.trackingNumber || '');
        setNotes(o.notes || '');
      })
      .catch(async () => {
        try {
          const publicOrder = await api.orders.get(orderId);
          if (publicOrder && !publicOrder.error) {
            setOrder(publicOrder);
            setStatus(publicOrder.status || 'pending');
            setTracking(publicOrder.trackingNumber || '');
            setNotes(publicOrder.notes || '');
            return;
          }
        } catch { /* proceed to local */ }

        const local = getCustomerOrders().find(
          (o: any) => o.orderId === orderId || o._id === orderId || o.id === orderId
        );
        if (local) {
          setOrder(local);
          setStatus(local.status || 'pending');
          setTracking(local.trackingNumber || '');
          setNotes((local as any).notes || '');
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let updated: any = null;
      try {
        updated = await adminApi.orders.update(orderId, { status, trackingNumber: tracking, notes });
      } catch {
        // Continue with local update if server is not reachable
      }
      updateCustomerOrderStatus(orderId, status, tracking, notes);
      setOrder((prev: any) => ({
        ...(updated || prev || {}),
        status,
        trackingNumber: tracking,
        notes,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes');
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const copyTracking = () => {
    if (!tracking) return;
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-28 bg-cream-200/50" />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 card p-10 max-w-md mx-auto">
        <p className="text-brand-700 font-semibold mb-2">Order Not Found</p>
        <p className="text-xs text-brand-500 mb-6">The requested order identifier could not be retrieved from the database.</p>
        <button onClick={onBack} className="btn-primary py-2.5 px-6 text-xs">
          Return to Orders
        </button>
      </div>
    );
  }

  const timelineIdx = TIMELINE.indexOf(order.status);
  const StatusIcon = STATUS_ICONS[order.status] || Clock;
  const badgeStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-700 hover:text-brand-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </button>

        <span className="text-xs text-brand-500 font-mono">
          System ID: {order._id || order.orderId}
        </span>
      </div>

      {/* Main Order Dossier Header */}
      <div className="card p-6 sm:p-7 bg-white border border-brand-200/70 shadow-luxury">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-500 mb-1">
              Order Reference
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl sm:text-3xl font-bold text-brand-950">
                #{order.orderId}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize border ${badgeStyle.bg} ${badgeStyle.text}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{order.status || 'pending'}</span>
              </span>
            </div>
            <p className="text-xs text-brand-500 mt-2 font-medium">
              Registered on {new Date(order.createdAt || order.placedAt || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-brand-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500 block">
              Grand Total (COD)
            </span>
            <div className="font-serif text-3xl font-bold text-brand-950">
              {formatPrice(order.total)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline (if not cancelled) */}
      {order.status !== 'cancelled' && (
        <div className="card p-6 bg-white border border-brand-200/70 shadow-luxury">
          <h2 className="font-serif text-sm sm:text-base font-bold text-brand-950 mb-5">
            Logistics Pipeline Status
          </h2>
          <div className="flex items-center justify-between">
            {TIMELINE.map((s, i) => {
              const isPassed = i <= timelineIdx;
              const isCurrent = i === timelineIdx;
              const Icon = STATUS_ICONS[s] || Clock;

              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-brand-800 text-cream-50 ring-4 ring-brand-200 shadow-md'
                          : isPassed
                            ? 'bg-brand-700 text-cream-50'
                            : 'bg-cream-200/70 text-brand-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold mt-2 capitalize ${
                      isPassed ? 'text-brand-950 font-bold' : 'text-brand-400'
                    }`}>
                      {s}
                    </span>
                  </div>

                  {i < TIMELINE.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 -mt-5 rounded-full transition-colors ${
                        i < timelineIdx ? 'bg-brand-700' : 'bg-cream-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Split Details Layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column: Order Items & Customer Details (3 cols) */}
        <div className="lg:col-span-3 space-y-6">

          {/* Purchased Items */}
          <div className="card p-6 bg-white border border-brand-200/70 shadow-luxury">
            <h2 className="font-serif text-base font-bold text-brand-950 mb-4">
              Manifest Items ({order.items?.length || 0})
            </h2>

            <div className="space-y-3.5">
              {order.items?.map((item: any) => (
                <div
                  key={item._id || item.id}
                  className="flex gap-3.5 items-center p-3 rounded-xl bg-cream-50/50 border border-brand-100"
                >
                  <img
                    src={item.image}
                    alt={item.grade}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-200/60"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                      {item.grade}
                    </div>
                    <div className="text-sm font-bold text-brand-950 truncate">
                      {item.type} Cashews
                    </div>
                    <div className="text-xs text-brand-500 font-medium">
                      Pack Weight: {item.quantity} • Qty {item.count}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-brand-950">
                      {formatPrice(item.price * item.count)}
                    </div>
                    <div className="text-[11px] text-brand-400 font-normal">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoicing Breakdown */}
            <div className="border-t border-brand-100 mt-5 pt-4 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-brand-600 font-medium">
                <span>Items Subtotal</span>
                <span className="text-brand-950 font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-600 font-medium">
                <span>Logistics / Shipping</span>
                <span className="text-brand-950 font-semibold">
                  {order.shipping === 0 ? <span className="text-forest-700 font-bold">FREE</span> : formatPrice(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-brand-200/80 items-baseline">
                <span className="font-serif text-base font-bold text-brand-950">Grand Total</span>
                <span className="font-serif text-2xl font-bold text-brand-950">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Address with Interactive Maps */}
          {(() => {
            const c = order.customer || {};
            const hasCoords = typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng);

            // Priority: Exact GPS coordinates (foolproof, never breaks regardless of typos/numbers)
            const googleMapsQuery = hasCoords
              ? `${c.lat},${c.lng}`
              : [c.doorNo, c.address, c.city, c.state, c.pincode, 'India'].filter(Boolean).join(' ');

            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
            const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(googleMapsQuery)}`;
            const embedMapsUrl = hasCoords
              ? `https://maps.google.com/maps?q=${c.lat},${c.lng}&z=16&output=embed`
              : `https://maps.google.com/maps?q=${encodeURIComponent(googleMapsQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

            const copyFullAddress = () => {
              const formatted = `${c.fullName || 'Valued Customer'}\n${c.doorNo ? `Flat/Door: ${c.doorNo}\n` : ''}${c.address || ''}\n${c.city || ''}, ${c.state || ''} - ${c.pincode || ''}\n${hasCoords ? `Exact GPS Pin: ${c.lat}, ${c.lng}\n` : ''}Phone: ${c.phone || ''}\nEmail: ${c.email || ''}`;
              navigator.clipboard.writeText(formatted);
              setCopiedAddress(true);
              setTimeout(() => setCopiedAddress(false), 2200);
            };

            const phoneClean = (c.phone || '').replace(/\D/g, '').slice(-10);

            return (
              <div className="card p-6 bg-white border border-brand-200/70 shadow-luxury space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-100">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-brand-950 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-forest-700" />
                      <span>Customer & Delivery Destination</span>
                    </h2>
                    <p className="text-xs text-brand-500 mt-0.5">
                      Verified shipping coordinates, recipient dossier & navigation
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyFullAddress}
                      className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 font-semibold text-brand-700 shadow-xs"
                      title="Copy formatted address for courier shipping labels"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-forest-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAddress ? 'Copied Label' : 'Copy Address'}</span>
                    </button>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 font-semibold shadow-xs"
                      title="Open location directly in Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Open in Maps</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  </div>
                </div>

                {/* Recipient Contact Card */}
                <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm bg-cream-50/70 p-4 rounded-2xl border border-brand-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500 block mb-0.5">
                      Recipient Name
                    </span>
                    <div className="font-bold text-brand-950 text-base">
                      {c.fullName || 'Not Provided'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500 block mb-0.5">
                      Contact Phone
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-brand-950 font-mono text-base">
                        {c.phone || '—'}
                      </span>
                      {c.phone && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${c.phone}`}
                            className="p-1.5 rounded-lg bg-white border border-brand-200 text-brand-700 hover:text-brand-950 hover:bg-cream-100 transition-colors"
                            title="Call Customer directly"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          {phoneClean && (
                            <a
                              href={`https://wa.me/91${phoneClean}?text=Hello%20${encodeURIComponent(c.fullName || '')},%20this%20is%20regarding%20your%20Krisha%20Dry%20Fruits%20Order%20%23${order.orderId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-600 text-white hover:bg-forest-700 transition-colors text-[11px] font-bold shadow-xs"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-brand-200/60 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500 block">
                        Email Address
                      </span>
                      <a
                        href={`mailto:${c.email}`}
                        className="text-brand-900 font-medium hover:underline text-xs sm:text-sm"
                      >
                        {c.email || '—'}
                      </a>
                    </div>

                    <a
                      href={googleDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 hover:text-brand-950 bg-white border border-brand-200 px-3 py-1 rounded-lg hover:bg-cream-100 transition-colors shadow-xs"
                    >
                      <Navigation className="w-3.5 h-3.5 text-forest-700" />
                      <span>Get Driving Directions</span>
                    </a>
                  </div>
                </div>

                {/* Clickable Postal Address Card */}
                <div
                  onClick={() => window.open(googleMapsUrl, '_blank')}
                  className="group p-4 rounded-2xl bg-white border-2 border-brand-200/80 hover:border-forest-600/70 hover:shadow-md cursor-pointer transition-all duration-300 relative"
                  title="Click to view this exact location on Google Maps"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-forest-100/90 text-forest-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-forest-600 group-hover:text-white transition-colors shadow-xs">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-forest-800 mb-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>Complete Shipping Address</span>
                          {hasCoords ? (
                            <span className="text-[10px] text-forest-700 font-bold bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                              ✓ Verified Exact GPS Pin
                            </span>
                          ) : (
                            <span className="text-[10px] text-brand-400 font-normal group-hover:text-forest-700">
                              (Click to navigate in Google Maps)
                            </span>
                          )}
                        </div>
                        {c.doorNo && (
                          <div className="text-xs font-semibold text-brand-700 mb-0.5">
                            <span className="text-brand-400 font-normal">Flat / Door No:</span> {c.doorNo}
                          </div>
                        )}
                        <div className="text-sm sm:text-base font-bold text-brand-950 leading-relaxed">
                          {c.address || 'Street address not provided'}
                        </div>
                        <div className="text-xs sm:text-sm text-brand-700 font-semibold mt-1 flex items-center gap-2 flex-wrap">
                          <span>{c.city}{c.city && c.state ? ', ' : ''}{c.state}</span>
                          {c.pincode && (
                            <span className="font-mono bg-cream-200/80 px-2 py-0.5 rounded text-brand-950 font-bold border border-brand-300/80">
                              PIN: {c.pincode}
                            </span>
                          )}
                          <span className="text-brand-400 font-normal">• India</span>
                        </div>
                        {hasCoords && (
                          <div className="mt-2 text-xs font-mono text-forest-700 bg-forest-50 px-2.5 py-1 rounded-md border border-forest-200 inline-flex items-center gap-1.5">
                            <Navigation className="w-3 h-3 text-forest-600" />
                            <span>GPS: {c.lat?.toFixed(6)}, {c.lng?.toFixed(6)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-cream-100 text-brand-600 group-hover:bg-forest-600 group-hover:text-white transition-colors shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Delivery Instructions if provided */}
                {c.notes && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <strong className="font-bold block mb-0.5 text-amber-900">
                        Customer Delivery Notes / Gate Code:
                      </strong>
                      <p className="leading-relaxed font-medium">{c.notes}</p>
                    </div>
                  </div>
                )}

                {/* Interactive Embedded Google Map */}
                <div className="rounded-2xl overflow-hidden border border-brand-200/80 shadow-sm bg-cream-100">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-cream-100/90 border-b border-brand-200/70 text-xs font-bold text-brand-900">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-forest-700" />
                      <span>Live Delivery Destination Map (Google Maps)</span>
                    </span>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-forest-800 hover:text-forest-950 font-bold text-[11px] hover:underline"
                    >
                      <span>Open Full Screen</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <iframe
                    title="Order Delivery Destination Map"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={embedMapsUrl}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Column: Update Fulfillment Status & Notes (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-white border border-brand-200/70 shadow-luxury space-y-5">
            <h2 className="font-serif text-base font-bold text-brand-950">
              Update Dispatch State
            </h2>

            {/* Status Select */}
            <div>
              <label className="text-xs font-bold text-brand-900 mb-1.5 block">
                Fulfillment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field capitalize font-semibold text-xs sm:text-sm py-2.5"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>

            {/* Tracking Number Input */}
            <div>
              <label className="text-xs font-bold text-brand-900 mb-1.5 block">
                Carrier Waybill / Tracking #
              </label>
              <div className="relative">
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  className="input-field font-mono text-xs sm:text-sm py-2.5 pr-9"
                  placeholder="e.g. DTDC987654321IN"
                />
                {tracking && (
                  <button
                    type="button"
                    onClick={copyTracking}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-800 p-1"
                    title="Copy tracking number"
                  >
                    {copiedTracking ? <Check className="w-3.5 h-3.5 text-forest-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div>
              <label className="text-xs font-bold text-brand-900 mb-1.5 block">
                Internal Staff Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field resize-none text-xs sm:text-sm"
                rows={3}
                placeholder="Private notes (packaging check, batch lot #, etc.)..."
              />
            </div>

            {/* Save Button */}
            {saveError && (
              <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                {saveError}
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-3 px-6 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                saved
                  ? 'bg-forest-700 text-cream-50'
                  : 'btn-primary'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : saved ? 'Successfully Saved!' : 'Save Fulfillment Changes'}</span>
            </button>
          </div>

          {/* Delivery Window Summary */}
          <div className="card p-5 bg-cream-50/60 border border-brand-200/60 text-xs">
            <span className="text-brand-500 font-medium block mb-1">Target Estimated Delivery</span>
            <div className="font-serif text-base font-bold text-brand-950">
              {order.estimatedDelivery}
            </div>
            <div className="mt-3 pt-3 border-t border-brand-200/50 flex items-center justify-between text-brand-600 font-medium">
              <span>Payment Mode:</span>
              <span className="font-bold text-brand-900 uppercase">Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
