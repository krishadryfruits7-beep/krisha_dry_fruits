import { ShoppingBag, Menu, X, Search, User as UserIcon, Package, MapPin, ExternalLink, LogIn, LogOut, Shield, PhoneCall } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/cart-context';
import { useUser, useClerk, SignInButton, UserButton } from '@/auth';
import { useSiteContent, getStoreGoogleMapsUrl } from '@/site-content';
import { useCustomerOrders } from '@/orders-storage';

interface HeaderProps {
  onNavigate: (page: string) => void;
  onOpenCart: () => void;
  onSearch: (query: string) => void;
  currentPage: string;
}

export default function Header({ onNavigate, onOpenCart, onSearch, currentPage }: HeaderProps) {
  const { totalItems } = useCart();
  const { isSignedIn, user } = useUser();
  const clerk = useClerk();
  const content = useSiteContent();
  const customerOrders = useCustomerOrders();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  const mapsUrl = getStoreGoogleMapsUrl(content.contact);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const scrollToStore = () => {
    if (currentPage !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById('store-location');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById('store-location');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  const navLink = (label: string, page: string) => {
    const active = currentPage === page;
    return (
      <button
        onClick={() => { onNavigate(page); setMobileOpen(false); }}
        className={`text-sm tracking-wide transition-all relative py-1 ${
          active
            ? 'text-brand-950 font-bold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-brand-600 after:rounded-full'
            : 'text-brand-800/80 hover:text-brand-950 font-medium'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Top micro announcement bar */}
      <div className="bg-brand-950 text-cream-100/90 text-center py-2 px-4 text-[11px] sm:text-xs font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <span className="truncate">
            {content.announcement || 'Free pan-India shipping over ₹1,200 • Freshly hand-sorted & packed within 48h'}
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-cream-50/95 backdrop-blur-md border-b border-brand-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Mobile Left: Hamburger Menu */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 -ml-2 rounded-xl text-brand-900 hover:bg-brand-100/60 transition-colors"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-6 h-6 stroke-[1.8]" />
              </button>
            </div>

            {/* Desktop Left: Logo */}
            <div className="hidden lg:flex items-center">
              <button
                onClick={() => onNavigate('home')}
                className="group flex items-center gap-3 focus:outline-none"
                aria-label="Krisha Dry Fruits Home"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white ring-2 ring-brand-300 shadow-sm flex items-center justify-center p-0.5 group-hover:ring-brand-500 transition-all shrink-0">
                  <img
                    src="/Krisha_Dry_Fruits_logo.png"
                    alt="Krisha Dry Fruits"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-serif text-lg font-bold text-brand-950 tracking-tight leading-none group-hover:text-brand-800 transition-colors">
                    Krisha
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-500 leading-none mt-1">
                    Dry Fruits
                  </span>
                </div>
              </button>
            </div>

            {/* Desktop Center: Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLink('Home', 'home')}
              {navLink('Shop Cashews', 'products')}
              {navLink('Our Grades', 'grades')}
              <button
                onClick={scrollToStore}
                className="text-sm tracking-wide text-brand-800/80 hover:text-brand-950 font-medium flex items-center gap-1.5 transition-colors"
                title="View Store Location & Map"
              >
                <MapPin className="w-3.5 h-3.5 text-forest-600" />
                <span>Store Location</span>
              </button>
              {navLink('About Us', 'about')}
              {navLink('Contact', 'contact')}
            </nav>

            {/* Mobile Center: Logo */}
            <div className="lg:hidden flex-1 flex justify-center">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 focus:outline-none"
                aria-label="Krisha Dry Fruits Home"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white ring-2 ring-brand-300 shadow-sm flex items-center justify-center p-0.5 shrink-0">
                  <img
                    src="/Krisha_Dry_Fruits_logo.png"
                    alt="Krisha Dry Fruits"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="font-serif text-base font-bold text-brand-950 tracking-tight">
                  Krisha
                </span>
              </button>
            </div>

            {/* Right Action Icons: Search, Location Pin, Orders, Cart, User */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Direct Google Maps Icon Button - visible on both mobile and desktop */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-brand-900 hover:text-forest-700 hover:bg-brand-100/50 rounded-full transition-colors flex items-center shrink-0"
                title="Open Shop in Google Maps"
                aria-label="Open Shop in Google Maps"
              >
                <MapPin className="w-5 h-5 stroke-[1.8] text-forest-700" />
              </a>

              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-brand-900 hover:text-brand-600 hover:bg-brand-100/50 rounded-full transition-colors"
                aria-label="Search Cashews"
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* My Orders Quick Icon Button (Desktop + Mobile) */}
              <button
                onClick={() => onNavigate('myorders')}
                className={`relative p-2 rounded-full transition-colors ${
                  currentPage === 'myorders'
                    ? 'bg-brand-200/70 text-brand-950'
                    : 'text-brand-900 hover:text-brand-600 hover:bg-brand-100/50'
                }`}
                aria-label="My Orders"
                title="View My Orders"
              >
                <Package className="w-5 h-5 stroke-[1.8]" />
                {customerOrders.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold bg-amber-600 text-white flex items-center justify-center shadow-sm">
                    {customerOrders.length}
                  </span>
                )}
              </button>

              {/* Cart Button with Count Badge */}
              <button
                onClick={onOpenCart}
                className="relative p-2 text-brand-900 hover:text-brand-600 hover:bg-brand-100/50 rounded-full transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                <span className={`absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                  totalItems > 0 ? 'bg-brand-600 text-cream-50 scale-100 shadow-sm' : 'bg-brand-200 text-brand-800 scale-90'
                }`}>
                  {totalItems}
                </span>
              </button>

              {/* User Account / Interactive Dropdown */}
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className={`p-2 rounded-full transition-all flex items-center justify-center ${
                    accountMenuOpen
                      ? 'bg-brand-200/80 text-brand-950 ring-2 ring-brand-500/30'
                      : 'text-brand-900 hover:text-brand-600 hover:bg-brand-100/50'
                  }`}
                  aria-label="User Account"
                  title={isSignedIn ? `Signed in as ${user?.firstName || 'Customer'}` : 'Account & Orders'}
                >
                  {isSignedIn && user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.firstName || 'User'}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-brand-400"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 stroke-[1.8]" />
                  )}
                </button>

                {/* Dropdown Menu Modal */}
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white rounded-2xl shadow-luxury border border-brand-200/80 py-3 px-3 z-50 animate-fade-in text-brand-950">
                    {isSignedIn ? (
                      <div>
                        {/* User Identity Header */}
                        <div className="flex items-center gap-3 p-2.5 bg-brand-50/70 rounded-xl border border-brand-200/50 mb-2">
                          {user?.imageUrl ? (
                            <img
                              src={user.imageUrl}
                              alt={user.fullName || 'User'}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-300"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-200 text-brand-800 font-bold flex items-center justify-center font-serif text-base">
                              {(user?.firstName?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold text-brand-950 truncate">
                              {user?.fullName || user?.firstName || 'Valued Customer'}
                            </p>
                            <p className="text-[11px] text-brand-600 truncate mt-0.5">
                              {user?.primaryEmailAddress?.emailAddress || user?.username || ''}
                            </p>
                          </div>
                        </div>

                        {/* Menu Options */}
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              onNavigate('myorders');
                              setAccountMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-900 hover:bg-brand-100/70 transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-brand-600" />
                              <span>My Orders & Shipments</span>
                            </span>
                            {customerOrders.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                {customerOrders.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setAccountMenuOpen(false);
                              try {
                                clerk?.openUserProfile?.();
                              } catch (e) {
                                console.warn('Could not open user profile', e);
                              }
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-900 hover:bg-brand-100/70 transition-colors"
                          >
                            <UserIcon className="w-4 h-4 text-brand-600" />
                            <span>Manage Profile & Details</span>
                          </button>
                        </div>

                        <div className="my-2 border-t border-brand-100" />

                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            try {
                              clerk?.signOut?.();
                            } catch (e) {
                              console.warn('Could not sign out', e);
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      <div>
                        {/* Guest Header */}
                        <div className="px-2.5 py-2 border-b border-brand-100 mb-2">
                          <p className="font-serif text-sm font-bold text-brand-950">Customer Account</p>
                          <p className="text-[11px] text-brand-600 mt-0.5 leading-snug">
                            Sign in to track orders, manage addresses, and view purchase history.
                          </p>
                        </div>

                        {/* Sign In Button */}
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            try {
                              clerk?.openSignIn?.({ fallbackRedirectUrl: window.location.href });
                            } catch {
                              // If Clerk SDK popup fails, fallback
                              console.warn('Failed to open Clerk Sign In');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-cream-50 text-xs font-bold transition-colors shadow-xs"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Sign In / Register</span>
                        </button>

                        {/* Guest Quick Links */}
                        <div className="mt-2 space-y-1">
                          <button
                            onClick={() => {
                              onNavigate('myorders');
                              setAccountMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-brand-800 hover:bg-brand-50 hover:text-brand-950 transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-brand-600" />
                              <span>Track My Orders</span>
                            </span>
                            {customerOrders.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                {customerOrders.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              onNavigate('contact');
                              setAccountMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-800 hover:bg-brand-50 hover:text-brand-950 transition-colors"
                          >
                            <PhoneCall className="w-4 h-4 text-brand-600" />
                            <span>Customer Helpline</span>
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Search Input Bar */}
          {searchOpen && (
            <div className="py-3 border-t border-brand-200/40 animate-fade-in">
              <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cashew grades (e.g. W180, Roasted, Honey Glazed)..."
                  className="w-full rounded-full border border-brand-300 bg-white/90 pl-11 pr-24 py-2.5 text-sm text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 shadow-sm"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-700 text-cream-50 text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Luxury Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-brand-950/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-cream-50 h-full shadow-2xl flex flex-col z-10 animate-slide-in-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-200/60 bg-cream-100/50">
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-brand-950">Krisha</span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-brand-600">Dry Fruits</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-full text-brand-700 hover:bg-brand-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Nav Links */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-1">
              {[
                { label: 'Home', page: 'home' },
                { label: 'Shop Cashews', page: 'products' },
                { label: 'Our Grades Guide', page: 'grades' },
                { label: 'About Us', page: 'about' },
                { label: 'Contact Support', page: 'contact' },
              ].map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => { onNavigate(page); setMobileOpen(false); }}
                  className={`w-full text-left py-3 px-3 rounded-xl text-base transition-colors ${
                    currentPage === page
                      ? 'bg-brand-100 font-bold text-brand-900'
                      : 'text-brand-800 hover:bg-brand-100/60 font-medium'
                  }`}
                >
                  {label}
                </button>
              ))}

              {/* 1-Click Store Location Card in Mobile Drawer */}
              <div className="p-3.5 mt-2 rounded-2xl bg-white border border-brand-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-forest-800 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-forest-600" />
                  <span>Flagship Store • Margao, Goa</span>
                </div>
                <p className="text-[11px] text-brand-600 leading-tight">
                  {content.contact.address}
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-cream-50 text-[11px] font-bold shadow-xs transition-colors"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="pt-4 border-t border-brand-200/60 space-y-3">
                <button
                  onClick={() => { onNavigate('myorders'); setMobileOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-semibold text-brand-800 hover:bg-brand-100/70 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-brand-600" />
                    <span>Track My Orders</span>
                  </span>
                  {customerOrders.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {customerOrders.length}
                    </span>
                  )}
                </button>

                {!isSignedIn && (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      clerk?.openSignIn?.({ fallbackRedirectUrl: window.location.href });
                    }}
                    className="btn-primary w-full py-2.5 text-sm"
                  >
                    Sign In / Register
                  </button>
                )}

                <div className="px-3 pt-3 text-[11px] text-brand-600/80 leading-relaxed">
                  <p className="font-semibold text-brand-900">Krisha Dry Fruits</p>
                  <p>Hand-picked premium cashews directly sourced from Goa & Karnataka coast.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}