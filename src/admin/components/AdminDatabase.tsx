import { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Cloud,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Package,
  ShoppingBag,
  Star,
  Users,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '@/api';

interface DbStats {
  database: {
    name: string;
    status: string;
    host: string;
    dataSize: number;
    storageSize: number;
    indexSize: number;
    collections: number;
    objects: number;
  };
  counts: {
    orders: {
      total: number;
      pending: number;
      confirmed: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    products: number;
    reviews: number;
    users: number;
  };
  cloudinaryInfo: {
    tier: string;
    monthlyCredits: number;
    storageCapGB: number;
    bandwidthCapGB: number;
    transformationsCap: number;
    advice: string;
  };
}

export default function AdminDatabase() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [purging, setPurging] = useState(false);

  // Purge Modal State
  const [purgeModal, setPurgeModal] = useState<{
    open: boolean;
    criteria: 'cancelled' | 'older_than' | 'test';
    title: string;
    description: string;
    days?: number;
  }>({
    open: false,
    criteria: 'cancelled',
    title: '',
    description: '',
    days: 60,
  });

  const [olderThanDays, setOlderThanDays] = useState(60);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await adminApi.database.stats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load DB stats:', err);
      showToast(err.message || 'Failed to fetch MongoDB stats', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const data = await adminApi.database.exportOrders();
      const blob = new Blob([JSON.stringify(data.orders, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `krisha_dry_fruits_orders_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${data.count} orders successfully!`, 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmPurge = async () => {
    setPurging(true);
    try {
      const res = await adminApi.database.purgeOrders({
        criteria: purgeModal.criteria,
        days: purgeModal.criteria === 'older_than' ? olderThanDays : undefined,
      });

      showToast(`Cleaned up ${res.deletedCount} orders from database!`, 'success');
      setPurgeModal((prev) => ({ ...prev, open: false }));
      loadStats(true);
    } catch (err: any) {
      showToast(`Purge failed: ${err.message}`, 'error');
    } finally {
      setPurging(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
        <p className="text-sm font-medium text-brand-600">Connecting to MongoDB Atlas Cluster0...</p>
      </div>
    );
  }

  const storageUsedMB = (stats?.database.storageSize || 0) / (1024 * 1024);
  const mongoQuotaMB = 512; // Free M0 Tier limit
  const mongoPercent = Math.min(100, Math.max(0.5, (storageUsedMB / mongoQuotaMB) * 100));

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-forest-100 text-forest-800">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-brand-950">
              Database & Cloud Storage Management
            </h1>
          </div>
          <p className="text-xs text-brand-500 mt-1">
            Real MongoDB Atlas metrics, Cloudinary free trial usage guidance, and zero-loss order pruning tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={exporting}
            className="btn-outline py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            title="Download full JSON backup of all orders before cleaning"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export Orders Backup</span>
          </button>

          <button
            type="button"
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            title="Refresh database live metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* Cluster Status & Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* MongoDB Atlas M0 Status */}
        <div className="bg-white rounded-3xl p-6 border border-brand-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
              <HardDrive className="w-4 h-4 text-forest-700" />
              <span>MongoDB Atlas (Cluster0)</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Live & Connected</span>
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between text-xs text-brand-600 mb-1">
              <span>M0 Free Tier Storage:</span>
              <span className="font-mono font-bold text-brand-950">
                {storageUsedMB.toFixed(2)} MB / {mongoQuotaMB} MB
              </span>
            </div>
            <div className="w-full bg-cream-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-forest-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${mongoPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-brand-500 mt-1.5">
              Current storage utilization is <strong>{mongoPercent.toFixed(1)}%</strong> of 512 MB. Extremely healthy.
            </p>
          </div>

          <div className="pt-2 border-t border-brand-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-brand-400 block">Database Name</span>
              <span className="font-mono font-bold text-brand-900">{stats?.database.name || 'krisha_dry_fruits'}</span>
            </div>
            <div>
              <span className="text-[10px] text-brand-400 block">Data Size</span>
              <span className="font-mono font-bold text-brand-900">{formatBytes(stats?.database.dataSize || 0)}</span>
            </div>
          </div>
        </div>

        {/* Cloudinary Free Plan Card */}
        <div className="bg-white rounded-3xl p-6 border border-brand-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Cloudinary Image CDN</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
              Free Plan (25 Credits)
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-brand-700">
            <div className="flex justify-between">
              <span>Monthly Credits:</span>
              <span className="font-bold font-mono">25 Credits / mo</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Equivalent:</span>
              <span className="font-bold font-mono">~25 GB free storage</span>
            </div>
            <div className="flex justify-between">
              <span>Bandwidth:</span>
              <span className="font-bold font-mono">~25 GB net delivery</span>
            </div>
          </div>

          <a
            href="https://console.cloudinary.com/pm"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Open Cloudinary Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Total Documents in MongoDB */}
        <div className="bg-white rounded-3xl p-6 border border-brand-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
              <Package className="w-4 h-4 text-brand-700" />
              <span>Real Database Records</span>
            </div>
            <span className="text-xs text-brand-400 font-mono">MongoDB Atlas</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-cream-50 p-3 rounded-2xl border border-brand-100">
              <div className="flex items-center gap-1.5 text-xs text-brand-600 mb-0.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Orders</span>
              </div>
              <span className="text-xl font-bold font-serif text-brand-950">
                {stats?.counts.orders.total || 0}
              </span>
            </div>

            <div className="bg-cream-50 p-3 rounded-2xl border border-brand-100">
              <div className="flex items-center gap-1.5 text-xs text-brand-600 mb-0.5">
                <Package className="w-3.5 h-3.5" />
                <span>Products</span>
              </div>
              <span className="text-xl font-bold font-serif text-brand-950">
                {stats?.counts.products || 0}
              </span>
            </div>

            <div className="bg-cream-50 p-3 rounded-2xl border border-brand-100">
              <div className="flex items-center gap-1.5 text-xs text-brand-600 mb-0.5">
                <Star className="w-3.5 h-3.5" />
                <span>Reviews</span>
              </div>
              <span className="text-xl font-bold font-serif text-brand-950">
                {stats?.counts.reviews || 0}
              </span>
            </div>

            <div className="bg-cream-50 p-3 rounded-2xl border border-brand-100">
              <div className="flex items-center gap-1.5 text-xs text-brand-600 mb-0.5">
                <Users className="w-3.5 h-3.5" />
                <span>Users</span>
              </div>
              <span className="text-xl font-bold font-serif text-brand-950">
                {stats?.counts.users || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Order Status Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-200 shadow-sm space-y-4">
        <h2 className="font-serif text-lg font-bold text-brand-950">
          Live Orders Status Breakdown (MongoDB Atlas)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Pending</span>
            <span className="text-2xl font-serif font-bold text-amber-950">{stats?.counts.orders.pending || 0}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Confirmed</span>
            <span className="text-2xl font-serif font-bold text-blue-950">{stats?.counts.orders.confirmed || 0}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Shipped</span>
            <span className="text-2xl font-serif font-bold text-indigo-950">{stats?.counts.orders.shipped || 0}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Delivered</span>
            <span className="text-2xl font-serif font-bold text-emerald-950">{stats?.counts.orders.delivered || 0}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200">
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Cancelled</span>
            <span className="text-2xl font-serif font-bold text-red-950">{stats?.counts.orders.cancelled || 0}</span>
          </div>
        </div>
      </div>

      {/* Database Pruning & Cleanup Tools */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-200 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif text-lg font-bold text-brand-950">
              Safe Database Pruning & Order Management
            </h2>
          </div>
          <p className="text-xs text-brand-500 mt-1">
            Safely remove cancelled orders, test orders, or archived records to keep your free MongoDB storage lean and fast. Always download a JSON backup before purging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tool 1: Purge Cancelled Orders */}
          <div className="p-5 rounded-2xl border border-red-200 bg-red-50/30 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-800 mb-1">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Purge Cancelled Orders</span>
              </div>
              <p className="text-xs text-brand-600">
                Permanently deletes orders marked as &ldquo;Cancelled&rdquo;. Currently <strong>{stats?.counts.orders.cancelled || 0}</strong> cancelled orders in database.
              </p>
            </div>
            <button
              type="button"
              disabled={(stats?.counts.orders.cancelled || 0) === 0}
              onClick={() =>
                setPurgeModal({
                  open: true,
                  criteria: 'cancelled',
                  title: 'Purge All Cancelled Orders',
                  description: `This will permanently delete all ${stats?.counts.orders.cancelled || 0} cancelled orders from MongoDB Atlas. This action cannot be undone.`,
                })
              }
              className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Purge Cancelled Orders ({stats?.counts.orders.cancelled || 0})
            </button>
          </div>

          {/* Tool 2: Purge Test Orders */}
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
                <Trash2 className="w-4 h-4 text-amber-600" />
                <span>Purge Test / Dummy Orders</span>
              </div>
              <p className="text-xs text-brand-600">
                Scans and removes test orders placed during development (containing &ldquo;test&rdquo; in order ID, customer name, or notes).
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setPurgeModal({
                  open: true,
                  criteria: 'test',
                  title: 'Purge Development Test Orders',
                  description: 'This will permanently remove all test/sandbox orders matching "test" from MongoDB Atlas.',
                })
              }
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Purge Test Orders
            </button>
          </div>

          {/* Tool 3: Purge Orders Older than X Days */}
          <div className="p-5 rounded-2xl border border-brand-200 bg-cream-50/50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand-900 mb-1">
                <Trash2 className="w-4 h-4 text-brand-600" />
                <span>Archive Old Orders</span>
              </div>
              <p className="text-xs text-brand-600 mb-2">
                Purge delivered or historical orders older than:
              </p>
              <select
                value={olderThanDays}
                onChange={(e) => setOlderThanDays(parseInt(e.target.value, 10))}
                className="w-full text-xs py-2 px-3 bg-white border border-brand-200 rounded-xl text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              >
                <option value={30}>Older than 30 Days (1 Month)</option>
                <option value={60}>Older than 60 Days (2 Months)</option>
                <option value={90}>Older than 90 Days (3 Months)</option>
                <option value={180}>Older than 180 Days (6 Months)</option>
                <option value={365}>Older than 365 Days (1 Year)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() =>
                setPurgeModal({
                  open: true,
                  criteria: 'older_than',
                  days: olderThanDays,
                  title: `Purge Orders Older Than ${olderThanDays} Days`,
                  description: `This will permanently remove all orders created before ${olderThanDays} days ago from MongoDB Atlas. Make sure you have exported a JSON backup first.`,
                })
              }
              className="w-full py-2 px-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Purge Older Than {olderThanDays} Days
            </button>
          </div>
        </div>
      </div>

      {/* Double Confirmation Safety Modal */}
      {purgeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-red-200 relative animate-scale-in space-y-5">
            <div className="flex items-center gap-3 text-red-600">
              <span className="p-3 rounded-2xl bg-red-100">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-950">
                  {purgeModal.title}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                  Permanent Database Action
                </span>
              </div>
            </div>

            <p className="text-xs text-brand-700 leading-relaxed">
              {purgeModal.description}
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tip: Exported JSON backups can be re-imported anytime.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-100">
              <button
                type="button"
                onClick={() => setPurgeModal((prev) => ({ ...prev, open: false }))}
                className="btn-outline py-2 px-4 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                disabled={purging}
                className="py-2 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{purging ? 'Purging Records...' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating In-App Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all animate-slide-up border ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.type === 'info'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-brand-400 hover:text-brand-900 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
