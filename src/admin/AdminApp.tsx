import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ArrowLeft, AlertCircle, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { useUser, useClerk } from '@/auth';
import { isAdminAuthorized } from '@/admin-auth';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminContent from './components/AdminContent';
import AdminProducts from './components/AdminProducts';
import AdminOrders from './components/AdminOrders';
import AdminOrderDetail from './components/AdminOrderDetail';
import AdminAdmins from './components/AdminAdmins';

export type AdminPage = 'dashboard' | 'content' | 'products' | 'orders' | 'order-detail' | 'admins';

export default function AdminApp() {
  // Always call all hooks unconditionally at top level
  const { isSignedIn, user, isLoaded } = useUser();
  const clerk = useClerk();

  const getInitialAdminState = () => {
    if (typeof window === 'undefined') return { page: 'dashboard' as AdminPage, orderId: null };
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as AdminPage | null;
    const validTabs: AdminPage[] = ['dashboard', 'content', 'products', 'orders', 'order-detail', 'admins'];
    const p = tab && validTabs.includes(tab) ? tab : 'dashboard';
    const oId = params.get('orderId');
    return { page: p, orderId: oId };
  };

  const initialAdmin = getInitialAdminState();
  const [page, setPage] = useState<AdminPage>(initialAdmin.page);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialAdmin.orderId);

  const navigate = useCallback((p: AdminPage, orderId?: string, replace = false) => {
    setPage(p);
    if (orderId) setSelectedOrderId(orderId);
    else if (p !== 'order-detail') setSelectedOrderId(null);

    const queryParts: string[] = [];
    if (p !== 'dashboard') queryParts.push(`tab=${p}`);
    if (orderId) queryParts.push(`orderId=${encodeURIComponent(orderId)}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const url = `/admin${qs}`;

    const stateObj = { adminPage: p, orderId: orderId || null };
    if (replace) {
      window.history.replaceState(stateObj, '', url);
    } else {
      window.history.pushState(stateObj, '', url);
    }
  }, []);

  // Listen to browser Back/Forward buttons
  useEffect(() => {
    // Sync initial state to history so back button always stays in admin
    const initialQuery = window.location.search;
    if (!window.history.state || !window.history.state.adminPage) {
      window.history.replaceState(
        { adminPage: page, orderId: selectedOrderId },
        '',
        `/admin${initialQuery}`
      );
    }

    const onPop = (e: PopStateEvent) => {
      if (e.state && e.state.adminPage) {
        setPage(e.state.adminPage);
        setSelectedOrderId(e.state.orderId || null);
      } else {
        const p = new URLSearchParams(window.location.search);
        const t = (p.get('tab') as AdminPage) || 'dashboard';
        const o = p.get('orderId');
        setPage(t);
        setSelectedOrderId(o || null);
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [page, selectedOrderId]);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isGoogleAdmin = Boolean(isSignedIn && userEmail && isAdminAuthorized(userEmail));

  const handleLogout = async () => {
    try {
      await clerk.signOut();
    } catch (e) {
      console.warn('Sign out error', e);
    }
  };

  const handleGoogleSignIn = () => {
    try {
      clerk.openSignIn({ fallbackRedirectUrl: window.location.href });
    } catch {
      // Fallback redirect if popup is blocked
      window.location.href = '/admin';
    }
  };

  const handleBackFromDetail = () => {
    if (window.history.state && window.history.state.adminPage === 'order-detail' && window.history.length > 1) {
      window.history.back();
    } else {
      navigate('orders');
    }
  };

  // Case 1: Clerk SDK session state is still loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-[#180d07] to-brand-900 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/20 text-center space-y-4 animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto text-brand-700">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h2 className="font-serif text-lg font-bold text-brand-950">Krisha Executive Panel</h2>
          <p className="text-xs text-brand-600">Verifying administrative security session...</p>
        </div>
      </div>
    );
  }

  // Case 2: Signed in with a Google account that is NOT authorized in whitelist
  if (isSignedIn && !isGoogleAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-[#180d07] to-brand-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-red-100 text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-brand-950 mb-2">
            Access Restricted
          </h1>
          <p className="text-xs text-brand-600 mb-6 leading-relaxed">
            You are signed in as <span className="font-bold text-brand-900">{userEmail}</span>, but this account is not authorized to access the Krisha Executive Console.
          </p>

          <div className="p-4 rounded-2xl bg-cream-50 border border-brand-200 text-xs text-brand-700 text-left space-y-2 mb-6">
            <div className="font-bold text-brand-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-forest-600" />
              <span>Access Control Policy:</span>
            </div>
            <p>
              Administrative access is strictly restricted to authorized team members. If you need access, please contact the administrator.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleLogout}
              className="w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch Google Account</span>
            </button>

            <a
              href="/"
              className="w-full text-center py-2 text-xs font-medium text-brand-600 hover:text-brand-900 block"
            >
              Return to Public Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Not signed in at all -> Google OAuth Login
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-[#180d07] to-brand-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-forest-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 animate-scale-in">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white ring-4 ring-brand-300/80 shadow-md flex items-center justify-center p-1 mx-auto mb-3">
              <img
                src="/Krisha_Dry_Fruits_logo.png"
                alt="Krisha Dry Fruits"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h1 className="font-serif text-2xl font-bold text-brand-950 tracking-tight">
              Krisha Dry Fruits
            </h1>
            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-brand-500 mt-1">
              Executive Management Console
            </p>
          </div>

          {/* Primary Authentication: Google Sign-in */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white border-2 border-brand-200 hover:border-brand-500 text-brand-950 text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 group cursor-pointer"
            >
              {/* Google 'G' Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Authorized Google Account</span>
              <ArrowRight className="w-4 h-4 ml-auto text-brand-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="p-4 rounded-2xl bg-cream-50/80 border border-brand-200/90 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900">
                <ShieldCheck className="w-4 h-4 text-forest-600" />
                <span>Google OAuth Secured</span>
              </div>
              <p className="text-[11px] text-brand-600 leading-relaxed">
                Sign in with your authorized executive Google account to manage products, inventories, orders, and content.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-brand-100 flex items-center justify-between text-xs text-brand-500">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-brand-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </a>
            <span className="flex items-center gap-1 text-[11px] text-forest-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Access Only</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Case 4: Authenticated Authorized Admin
  return (
    <AdminLayout
      page={page}
      onNavigate={(p) => navigate(p as AdminPage)}
      onLogout={handleLogout}
      userEmail={userEmail || 'Admin Session'}
    >
      {page === 'dashboard' && <AdminDashboard onNavigate={navigate} />}
      {page === 'content' && <AdminContent />}
      {page === 'products' && <AdminProducts />}
      {page === 'orders' && <AdminOrders onViewOrder={(id) => navigate('order-detail', id)} />}
      {page === 'order-detail' && selectedOrderId && (
        <AdminOrderDetail orderId={selectedOrderId} onBack={handleBackFromDetail} />
      )}
      {page === 'admins' && <AdminAdmins />}
    </AdminLayout>
  );
}