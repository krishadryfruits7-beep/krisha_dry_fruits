import { ShoppingBag, Menu, X, Search, User as UserIcon, Package, MapPin, ExternalLink, LogIn, LogOut, Sparkles, PhoneCall, ChevronDown, Leaf, ShieldCheck, Gift } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/cart-context';
import { useUser, useClerk } from '@/auth';
import { useSiteContent, getStoreGoogleMapsUrl } from '@/site-content';
import { useCustomerOrders, isOrderActive } from '@/orders-storage';
import { CATEGORIES } from '@/data';

interface HeaderProps {
  onNavigate: (page: string) => void;
  onOpenCart: () => void;
  onSearch: (query: string) => void;
  onSelectCategory?: (category: string) => void;
  currentPage: string;
}

const QUICK_SEARCH_TAGS = [
  { label: 'California Almonds', query: 'Almond' },
  { label: 'Kashmiri Mamra', query: 'Mamra' },
  { label: 'W180 King Cashews', query: 'W180' },
  { label: 'Snow White Akhrot', query: 'Walnut' },
  { label: 'Royal Medjool Dates', query: 'Medjool' },
  { label: 'Roasted Pistachios', query: 'Pistachio' },
  { label: 'Afghan Anjeer', query: 'Anjeer' },
  { label: 'Gift Boxes', query: 'Gift' },
];

export default function Header({
  onNavigate,
  onOpenCart,
  onSearch,
  onSelectCategory,
  currentPage,
}: HeaderProps) {
  const { totalItems } = useCart();
  const { isSignedIn, user } = useUser();
  const clerk = useClerk();
  const content = useSiteContent();
  const customerOrders = useCustomerOrders();
  const activeOrdersCount = customerOrders.filter(isOrderActive).length;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopAllDropdownOpen, setShopAllDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const shopAllRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
      if (shopAllRef.current && !shopAllRef.current.contains(e.target as Node)) {
        setShopAllDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountMenuOpen(false);
        setCategoriesDropdownOpen(false);
        setShopAllDropdownOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const mapsUrl = getStoreGoogleMapsUrl(content.contact);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const handleQuickTagClick = (tagQuery: string) => {
    setQuery(tagQuery);
    onSearch(tagQuery);
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

  const handleCategoryClick = (catId: string) => {
    setCategoriesDropdownOpen(false);
    setShopAllDropdownOpen(false);
    setMobileOpen(false);
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      onNavigate('products');
    }
    setTimeout(() => {
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      {/* ── Top Announcement Bar (Mockup Style: Deep Olive Green) ─────────────── */}
      <div className="bg-[#1E2816] text-[#E5DFD4] py-2 px-4 text-[11px] sm:text-xs font-medium tracking-wide border-b border-black/20 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Dynamic Announcement from Admin Content */}
          <div className="flex items-center gap-2 truncate">
            <span className="flex items-center gap-1.5 text-[#E7E2D8] truncate">
              <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {content.announcement || 'Free pan-India shipping on orders over ₹1,200 • 100% Natural & Premium Quality'}
              </span>
            </span>
          </div>

          {/* Right: Track Order Link */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('myorders')}
              className="inline-flex items-center gap-1.5 text-amber-200/95 hover:text-white transition-colors cursor-pointer font-medium"
            >
              <Package className="w-3.5 h-3.5 text-amber-300" />
              <span>Track Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Sticky Navigation Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFC8]/70 transition-all select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">

            {/* Mobile Left: Hamburger Menu */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 -ml-2 rounded-xl text-[#1E150F] hover:bg-[#F0E6D8] transition-colors"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-6 h-6 stroke-[1.8]" />
              </button>
            </div>

            {/* Desktop Left: Brand Logo & Title */}
            <div className="flex items-center">
              <button
                onClick={() => onNavigate('home')}
                className="group flex items-center gap-3 focus:outline-none"
                aria-label="Krisha Dry Fruits Home"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white ring-1 ring-[#CDB397]/60 shadow-xs flex items-center justify-center p-0.5 group-hover:ring-[#8C6339] transition-all shrink-0">
                  <img
                    src={content.logo || "/Krisha_Dry_Fruits_logo.png"}
                    alt="Krisha Dry Fruits"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-serif text-2xl font-bold text-[#1E150F] tracking-tight leading-none group-hover:text-[#8C6339] transition-colors">
                    Krisha
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-[0.22em] text-[#8C6339] leading-none mt-1">
                    DRY FRUITS & NUTS
                  </span>
                </div>
              </button>
            </div>

            {/* Desktop Center: Navigation Links with Active Home Pill */}
            <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
              {/* Active Home Pill (Exact Match to Mockup) */}
              <button
                onClick={() => onNavigate('home')}
                className={`px-5 py-2 rounded-full font-medium text-sm transition-all shadow-xs cursor-pointer ${
                  currentPage === 'home'
                    ? 'bg-[#202919] text-white'
                    : 'text-[#2C231B] hover:text-[#8C6339] hover:bg-[#F3ECE4]'
                }`}
              >
                Home
              </button>

              {/* Shop All Dropdown */}
              <div className="relative" ref={shopAllRef}>
                <button
                  onClick={() => setShopAllDropdownOpen(!shopAllDropdownOpen)}
                  className="px-3.5 py-2 text-sm font-medium text-[#2C231B] hover:text-[#8C6339] rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Shop All</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-[#8C7A6A] ${shopAllDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {shopAllDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-luxury border border-[#E7DDCF] p-2 z-50 animate-fade-in text-sm">
                    <button
                      onClick={() => { setShopAllDropdownOpen(false); onNavigate('products'); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6F0] font-semibold text-[#1E150F]"
                    >
                      All Dry Fruits Collection
                    </button>
                    <button
                      onClick={() => handleCategoryClick('almonds')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6F0] text-[#4A3E31]"
                    >
                      Almonds (Mamra & California)
                    </button>
                    <button
                      onClick={() => handleCategoryClick('cashews')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6F0] text-[#4A3E31]"
                    >
                      Artisanal Cashews (W180 - W320)
                    </button>
                    <button
                      onClick={() => handleCategoryClick('walnuts')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6F0] text-[#4A3E31]"
                    >
                      Snow White Walnuts (Akhrot)
                    </button>
                    <button
                      onClick={() => handleCategoryClick('pistachios')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6F0] text-[#4A3E31]"
                    >
                      Roasted Afghani Pistachios
                    </button>
                    <button
                      onClick={() => handleCategoryClick('dates')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6F0] text-[#4A3E31]"
                    >
                      Royal Medjool & Ajwa Dates
                    </button>
                    <button
                      onClick={() => handleCategoryClick('figs')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6F0] text-[#4A3E31]"
                    >
                      Afghan Dried Figs (Anjeer)
                    </button>
                  </div>
                )}
              </div>

              {/* Categories Mega Dropdown */}
              <div className="relative" ref={categoriesRef}>
                <button
                  onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-full flex items-center gap-1 transition-colors cursor-pointer ${
                    categoriesDropdownOpen
                      ? 'text-[#8C6339] font-bold'
                      : 'text-[#2C231B] hover:text-[#8C6339]'
                  }`}
                >
                  <span>Categories</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-[#8C7A6A] ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoriesDropdownOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-white rounded-3xl shadow-luxury-xl border border-[#E7DDCF] p-4 z-50 animate-fade-in grid grid-cols-2 gap-2 text-[#1E150F]">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-[#FAF6F0] transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-[#F5EBE1] border border-[#EADBCA]">
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-[#1E150F] group-hover:text-[#8C6339] transition-colors truncate">
                              {cat.name}
                            </span>
                            {cat.hindiName && (
                              <span className="text-[11px] text-[#8C7A6A] font-normal">({cat.hindiName})</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#706456] line-clamp-1 leading-tight mt-0.5">
                            {cat.tagline}
                          </p>
                        </div>
                      </button>
                    ))}
                    <div className="col-span-2 pt-2 border-t border-[#F0E6D8] mt-1 flex items-center justify-between text-xs">
                      <button
                        onClick={() => { setCategoriesDropdownOpen(false); onNavigate('grades'); }}
                        className="text-[#8C6339] hover:text-[#1E150F] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sourcing & Caliber Guide</span>
                      </button>
                      <button
                        onClick={() => { setCategoriesDropdownOpen(false); onNavigate('products'); }}
                        className="text-[#202919] hover:text-[#8C6339] font-bold cursor-pointer"
                      >
                        View Full Catalog →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Gift Boxes */}
              <button
                onClick={() => handleCategoryClick('gift-boxes')}
                className="px-3.5 py-2 text-sm font-medium text-[#2C231B] hover:text-[#8C6339] rounded-full transition-colors cursor-pointer"
              >
                Gift Boxes
              </button>

              {/* Our Story */}
              <button
                onClick={() => onNavigate('about')}
                className={`px-3.5 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                  currentPage === 'about' ? 'text-[#8C6339] font-bold' : 'text-[#2C231B] hover:text-[#8C6339]'
                }`}
              >
                Our Story
              </button>

              {/* Contact */}
              <button
                onClick={scrollToStore}
                className="px-3.5 py-2 text-sm font-medium text-[#2C231B] hover:text-[#8C6339] rounded-full transition-colors cursor-pointer"
              >
                Contact
              </button>
            </nav>

            {/* Right Action Controls: Pill Search Bar + User + Cart */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Pill Search Bar (Exact Mockup Match) */}
              <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for dry fruits..."
                  className="w-48 lg:w-56 xl:w-64 bg-[#F3ECE4] text-[#2C2117] placeholder:text-[#9A8E82] text-xs font-medium rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-[#8C6339] border border-[#E7DFD4] transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-3 text-[#5A4F44] hover:text-[#1E150F] transition-colors cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`md:hidden p-2 rounded-full transition-colors ${
                  searchOpen ? 'bg-[#F0E6D8] text-[#1E150F]' : 'text-[#2C2117] hover:bg-[#F0E6D8]'
                }`}
                aria-label="Search Dry Fruits"
              >
                <Search className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* Store Location Pin */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[#2C2117] hover:text-[#8C6339] hover:bg-[#F3ECE4] rounded-full transition-colors hidden sm:flex items-center shrink-0"
                title="View Yeshwanthpur, Bangalore Store in Google Maps"
                aria-label="Google Maps"
              >
                <MapPin className="w-5 h-5 stroke-[1.8] text-[#2E4A22]" />
              </a>

              {/* User Account Button */}
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className={`p-2 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                    accountMenuOpen
                      ? 'bg-[#F0E6D8] text-[#1E150F] ring-2 ring-[#8C6339]/30'
                      : 'text-[#2C2117] hover:bg-[#F3ECE4]'
                  }`}
                  aria-label="User Account"
                  title={isSignedIn ? `Signed in as ${user?.firstName || 'Customer'}` : 'Account & Orders'}
                >
                  {isSignedIn && user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.firstName || 'User'}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-[#8C6339]"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 stroke-[1.8]" />
                  )}
                </button>

                {/* Account Dropdown Modal */}
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white rounded-2xl shadow-luxury-xl border border-[#E7DDCF] py-3 px-3 z-50 animate-fade-in text-[#1E150F]">
                    {isSignedIn ? (
                      <div>
                        <div className="flex items-center gap-3 p-2.5 bg-[#FAF6F0] rounded-xl border border-[#EADBCA] mb-2">
                          {user?.imageUrl ? (
                            <img
                              src={user.imageUrl}
                              alt={user.fullName || 'User'}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#8C6339]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#EADBCA] text-[#8C6339] font-bold flex items-center justify-center font-serif text-base">
                              {(user?.firstName?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold text-[#1E150F] truncate">
                              {user?.fullName || user?.firstName || 'Valued Customer'}
                            </p>
                            <p className="text-[11px] text-[#706456] truncate mt-0.5">
                              {user?.primaryEmailAddress?.emailAddress || user?.username || ''}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              onNavigate('myorders');
                              setAccountMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#1E150F] hover:bg-[#FAF6F0] transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-[#8C6339]" />
                              <span>My Orders & Shipments</span>
                            </span>
                            {activeOrdersCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                {activeOrdersCount}
                              </span>
                            )}
                          </button>
                        </div>

                        <div className="my-2 border-t border-[#F0E6D8]" />

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
                        <div className="px-2.5 py-2 border-b border-[#F0E6D8] mb-2">
                          <p className="font-serif text-sm font-bold text-[#1E150F]">Customer Account</p>
                          <p className="text-[11px] text-[#706456] mt-0.5 leading-snug">
                            Sign in to track orders, manage addresses, and view purchase history.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            try {
                              clerk?.openSignIn?.({ fallbackRedirectUrl: window.location.href });
                            } catch {
                              console.warn('Failed to open Clerk Sign In');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#202919] hover:bg-[#151C10] text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Sign In with Google</span>
                        </button>

                        <div className="mt-2 space-y-1">
                          <button
                            onClick={() => {
                              onNavigate('myorders');
                              setAccountMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#2C2117] hover:bg-[#FAF6F0] transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-[#8C6339]" />
                              <span>Track My Orders</span>
                            </span>
                            {activeOrdersCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                {activeOrdersCount}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              onNavigate('contact');
                              setAccountMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#2C2117] hover:bg-[#FAF6F0] transition-colors"
                          >
                            <PhoneCall className="w-4 h-4 text-[#8C6339]" />
                            <span>Customer Helpline</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shopping Bag / Cart with Badge */}
              <button
                onClick={onOpenCart}
                className="relative p-2 text-[#2C2117] hover:bg-[#F3ECE4] rounded-full transition-colors cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                <span className="absolute 0 top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#8C5E28] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-xs">
                  {totalItems}
                </span>
              </button>

            </div>
          </div>

          {/* Mobile Search Input Drawer (Dropdown) */}
          {searchOpen && (
            <div className="py-3 border-t border-[#E8DFC8]/60 animate-fade-in bg-[#FAF7F2] rounded-2xl mb-3 px-2 md:hidden">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search badam, cashews, walnuts, dates, pista..."
                  className="w-full rounded-full border border-[#D9C8B5] bg-white pl-10 pr-20 py-2.5 text-xs text-[#1E150F] placeholder-[#9A8E82] focus:outline-none focus:ring-2 focus:ring-[#8C6339]"
                  autoFocus
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6A]" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#202919] text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  Search
                </button>
              </form>

              <div className="mt-2 flex items-center gap-1.5 flex-wrap px-1">
                <span className="text-[10px] font-semibold text-[#8C7A6A] uppercase tracking-wider">Popular:</span>
                {QUICK_SEARCH_TAGS.slice(0, 5).map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => handleQuickTagClick(tag.query)}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-[#E7DDCF] text-[#4A3E31]"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile Slide-out Drawer ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative ml-0 w-80 max-w-full bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 animate-slide-right overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E7DDCF] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white ring-1 ring-[#CDB397] p-0.5 shrink-0">
                  <img
                    src={content.logo || "/Krisha_Dry_Fruits_logo.png"}
                    alt="Krisha Dry Fruits"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-serif text-lg font-bold text-[#1E150F]">Krisha</span>
                  <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#8C6339]">Dry Fruits & Nuts</span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-[#1E150F] hover:bg-[#F0E6D8]"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="p-4 space-y-1 flex-1">
              <button
                onClick={() => { onNavigate('home'); setMobileOpen(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm font-bold ${
                  currentPage === 'home' ? 'bg-[#202919] text-white' : 'text-[#1E150F] hover:bg-[#F3ECE4]'
                }`}
              >
                <span>Home</span>
              </button>

              <button
                onClick={() => { onNavigate('products'); setMobileOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-sm font-bold text-[#1E150F] hover:bg-[#F3ECE4]"
              >
                <span>Shop All Dry Fruits</span>
              </button>

              <button
                onClick={() => handleCategoryClick('gift-boxes')}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-sm font-bold text-[#1E150F] hover:bg-[#F3ECE4]"
              >
                <span className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#8C6339]" />
                  <span>Gift Boxes & Hampers</span>
                </span>
              </button>

              <div className="pt-3 pb-1 px-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6A]">Categories</span>
              </div>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-[#4A3E31] hover:bg-[#F3ECE4]"
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}

              <div className="my-2 border-t border-[#E7DDCF]" />

              <button
                onClick={() => { onNavigate('about'); setMobileOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-sm font-semibold text-[#1E150F] hover:bg-[#F3ECE4]"
              >
                <span>Our Story</span>
              </button>

              <button
                onClick={scrollToStore}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-sm font-semibold text-[#1E150F] hover:bg-[#F3ECE4]"
              >
                <span>Contact & Store Location</span>
              </button>

              <button
                onClick={() => { onNavigate('myorders'); setMobileOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-sm font-semibold text-[#1E150F] hover:bg-[#F3ECE4]"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#8C6339]" />
                  <span>My Orders</span>
                </span>
              </button>
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-[#E7DDCF] bg-white text-xs text-[#706456]">
              <p className="font-semibold text-[#1E150F]">Krisha Dry Fruits</p>
              <p className="text-[11px] mt-0.5">Yeshwanthpur, Bengaluru, Karnataka</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[#8C6339] font-bold hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
