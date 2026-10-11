import { LayoutDashboard, Package, ShoppingBag, LogOut, Menu, ExternalLink, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface AdminLayoutProps {
  page: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
  userEmail?: string | null;
}

const NAV = [
  { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'content', label: 'Storefront CMS & Content', icon: Sparkles },
  { id: 'products', label: 'Products & Inventory', icon: Package },
  { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
  { id: 'admins', label: 'Admin Team & Access', icon: Users },
];

export default function AdminLayout({ page, onNavigate, onLogout, children, userEmail }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#180e08] text-cream-100 w-64 border-r border-brand-900/60 shadow-2xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-900/60">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white ring-2 ring-brand-400/80 shadow-md flex items-center justify-center p-0.5 shrink-0">
          <img
            src="/Krisha_Dry_Fruits_logo.png"
            alt="Krisha Dry Fruits"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <div>
          <div className="font-serif text-sm font-bold text-cream-50 tracking-tight leading-tight">Krisha Console</div>
          <div className="text-[9px] tracking-[0.2em] uppercase font-semibold text-brand-400">HQ Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-500">
          Main Modules
        </div>

        {NAV.map(({ id, label, icon: Icon }) => {
          const active = page === id || (page === 'order-detail' && id === 'orders');
          return (
            <button
              key={id}
              onClick={() => { onNavigate(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                active
                  ? 'bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 text-cream-50 shadow-md shadow-brand-950/40 ring-1 ring-brand-400/30'
                  : 'text-cream-200/70 hover:bg-brand-900/40 hover:text-cream-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-500">
          Shortcuts
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-cream-300/70 hover:bg-brand-900/40 hover:text-cream-50 transition-all"
        >
          <span className="flex items-center gap-2.5">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Storefront</span>
          </span>
          <span className="text-[10px] bg-brand-900 px-1.5 py-0.5 rounded text-brand-400">Live</span>
        </a>
      </nav>

      {/* Session User & Logout */}
      <div className="p-4 border-t border-brand-900/60 bg-[#120a06]/60">
        <div className="flex items-center gap-2 mb-1 px-1">
          <div className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
          <span className="text-[11px] font-medium text-cream-300/90 truncate">
            {userEmail || 'Admin Session Active'}
          </span>
        </div>
        <div className="text-[10px] text-brand-400 mb-3 px-1">Verified Administrator</div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-300 hover:text-red-400 hover:bg-red-950/30 border border-brand-900/80 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out / Lock</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-cream-100/70">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 flex flex-col animate-slide-in-right">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full min-w-0 overflow-x-hidden">
        {/* Top Sticky Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-brand-200/60 px-4 sm:px-8 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-brand-900 hover:bg-brand-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-400 hidden sm:inline">Admin /</span>
              <span className="font-serif text-lg font-bold text-brand-950 capitalize">
                {page === 'order-detail' ? 'Order Fulfillment Detail' : page}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-forest-50 text-forest-700 border border-forest-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Production Mode</span>
            </span>
          </div>
        </header>

        {/* Dynamic View Container */}
        <main className="flex-1 p-3.5 sm:p-8 max-w-7xl w-full min-w-0 mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
