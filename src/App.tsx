import { useState, useEffect, useCallback } from 'react';
import { Package, Sparkles } from 'lucide-react';
import { CartProvider } from '@/cart-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import CategoryShowcase from '@/components/CategoryShowcase';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import ProductGrid from '@/components/ProductGrid';
import ProductDetail from '@/components/ProductDetail';
import CartDrawer from '@/components/CartDrawer';
import CheckoutPage from '@/components/CheckoutPage';
import OrderConfirmation from '@/components/OrderConfirmation';
import GradesGuide from '@/components/GradesGuide';
import GradeSelectorSection from '@/components/GradeSelectorSection';
import StoreLocationSection from '@/components/StoreLocationSection';
import About from '@/components/About';
import Contact from '@/components/Contact';
import MyOrders from '@/components/MyOrders';
import MobileBottomNav from '@/components/MobileBottomNav';
import { api } from '@/api';
import type { Product, OrderDetails, ProductCategory } from '@/types';
import { saveCustomerOrder, getCustomerOrders } from '@/orders-storage';
import { useStoredProducts, syncWithServerProducts } from '@/products-storage';
import { syncWithServerContent, useSiteContent } from '@/site-content';
import { syncWithServerReviews } from '@/reviews-storage';
import { CATEGORIES } from '@/data';

type Page = 'home' | 'products' | 'grades' | 'about' | 'contact' | 'product' | 'checkout' | 'confirmation' | 'myorders';

function getInitialPage(): Page {
  if (typeof window === 'undefined') return 'home';
  try {
    if (window.sessionStorage?.getItem('kdf_auth_return_product_id')) {
      return 'product';
    }
  } catch {}
  const p = window.location.pathname.replace(/^\//, '').split('?')[0] as Page;
  const validPages: Page[] = ['home', 'products', 'grades', 'about', 'contact', 'product', 'checkout', 'confirmation', 'myorders'];
  return validPages.includes(p) ? p : 'home';
}

function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderNotFound, setOrderNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const siteContent = useSiteContent();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(() => {
    if (typeof window === 'undefined') return null;
    return (new URLSearchParams(window.location.search).get('category') as ProductCategory) || null;
  });

  const [selectedGrade, setSelectedGrade] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('grade') || null;
  });

  const [selectedVariety, setSelectedVariety] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('location') || null;
  });

  const products = useStoredProducts();
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    api.content.get()
      .then((data) => {
        if (data && !data.error) {
          syncWithServerContent(data);
        }
      })
      .catch(() => {});

    setProductsLoading(true);
    api.products.list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          syncWithServerProducts(data as Product[]);
        }
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));

    api.reviews.list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          syncWithServerReviews(data);
        }
      })
      .catch(() => {});
  }, []);

  const navigate = useCallback((p: string) => {
    setPage(p as Page);
    if (p !== 'products') {
      setSelectedCategory(null);
      setSelectedLocation(null);
      setSelectedGrade(null);
      setSelectedVariety(null);
    }
    window.history.pushState({ page: p }, '', p === 'home' ? '/' : `/${p}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const viewProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setPage('product');
    const pid = (product as any)._id || product.id;
    window.history.pushState({ page: 'product', productId: pid }, '', `/product?id=${pid}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Return from guest sign-in rehydration
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      const pendingProdId = window.sessionStorage.getItem('kdf_auth_return_product_id');
      const returnUrl = window.sessionStorage.getItem('kdf_auth_return_url');
      if (pendingProdId && page !== 'product') {
        setPage('product');
        window.history.replaceState({ page: 'product', productId: pendingProdId }, '', returnUrl || `/product?id=${pendingProdId}`);
      }
    } catch {}
  }, [page]);

  // Recover selectedProduct if page is 'product' on mount
  useEffect(() => {
    if (page === 'product' && products.length > 0) {
      if (!selectedProduct) {
        const searchParams = new URLSearchParams(window.location.search);
        let prodId = searchParams.get('id') || window.history.state?.productId;
        if (!prodId && typeof window !== 'undefined' && window.sessionStorage) {
          prodId = window.sessionStorage.getItem('kdf_auth_return_product_id') || undefined;
        }
        const gradeParam = searchParams.get('grade');
        let found: Product | undefined;
        if (prodId) {
          found = products.find((p) => p.id === prodId || (p as any)._id === prodId);
        } else if (gradeParam) {
          found = products.find((p) => p.grade.toLowerCase() === gradeParam.toLowerCase());
        }
        if (found) {
          setSelectedProduct(found);
          try {
            window.sessionStorage?.removeItem('kdf_auth_return_product_id');
            window.sessionStorage?.removeItem('kdf_auth_return_url');
          } catch {}
        } else {
          setSelectedProduct(products[0]);
        }
      }
    }
  }, [page, selectedProduct, products]);

  // Browser back/forward history handling
  useEffect(() => {
    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page: getInitialPage() }, '', window.location.href);
    }

    const recoverOrder = async (oId: string | null) => {
      const allOrders = getCustomerOrders();
      if (oId) {
        const found = allOrders.find((x) => x.orderId === oId || (x as any)._id === oId);
        if (found) {
          setOrder(found);
          setOrderLoading(false);
          setOrderNotFound(false);
          return;
        }

        setOrderLoading(true);
        setOrderNotFound(false);
        try {
          const remote = await api.orders.get(oId);
          if (remote && (remote.orderId || (remote as any)._id)) {
            setOrder(remote);
            saveCustomerOrder(remote);
            setOrderNotFound(false);
          } else {
            setOrderNotFound(true);
          }
        } catch {
          setOrderNotFound(true);
        } finally {
          setOrderLoading(false);
        }
      } else if (allOrders.length > 0) {
        setOrder(allOrders[0]);
        setOrderLoading(false);
        setOrderNotFound(false);
      } else {
        setOrderNotFound(true);
        setOrderLoading(false);
      }
    };

    const initialPage = getInitialPage();
    if (initialPage === 'confirmation' && !order) {
      const searchParams = new URLSearchParams(window.location.search);
      const oId = searchParams.get('orderId') || searchParams.get('id');
      recoverOrder(oId);
    }

    const onPop = (e: PopStateEvent) => {
      const p = (e.state?.page as Page) || getInitialPage();
      setPage(p);
      if (p !== 'product') {
        setSelectedProduct(null);
      } else if (e.state?.productId) {
        const found = products.find((prod) => prod.id === e.state.productId || (prod as any)._id === e.state.productId);
        if (found) setSelectedProduct(found);
      }

      if (p === 'confirmation') {
        const oId = e.state?.orderId || new URLSearchParams(window.location.search).get('orderId');
        recoverOrder(oId);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [products, order]);

  const viewProductById = useCallback((id: string) => {
    const product = products.find((p) => p.id === id || (p as any)._id === id);
    if (product) viewProduct(product);
  }, [viewProduct, products]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setSelectedGrade(null);
    setSelectedVariety(null);
    setSelectedLocation(null);
    setPage('products');
    window.history.pushState({ page: 'products', search: query }, '', `/products?search=${encodeURIComponent(query)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectCategory = useCallback((catId: string) => {
    const finalCat = catId === 'all' ? null : (catId as ProductCategory);
    setSelectedCategory(finalCat);
    setSelectedGrade(null);
    setSelectedVariety(null);
    setSelectedLocation(null);
    setSearchQuery('');
    setPage('products');
    const qs = finalCat ? `?category=${finalCat}` : '';
    window.history.pushState({ page: 'products', category: finalCat }, '', `/products${qs}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectLocation = useCallback((locationKey: string) => {
    setSelectedLocation(locationKey);
    setSelectedCategory(null);
    setSelectedGrade(null);
    setSelectedVariety(null);
    setSearchQuery('');
    setPage('products');
    window.history.pushState({ page: 'products', location: locationKey }, '', '/products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectGrade = useCallback((grade: string) => {
    const matching = products.filter(
      (p) => p.grade.toLowerCase() === grade.toLowerCase() && p.active !== false
    );
    if (matching.length === 1) {
      viewProduct(matching[0]);
    } else {
      setSelectedGrade(grade);
      setSelectedCategory(null);
      setSelectedLocation(null);
      setSelectedVariety(null);
      setSearchQuery('');
      setPage('products');
      window.history.pushState({ page: 'products', grade }, '', `/products?grade=${grade}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [products, viewProduct]);

  const handlePlaceOrder = useCallback(async (o: OrderDetails) => {
    saveCustomerOrder(o);
    setOrder(o);
    setOrderLoading(false);
    setOrderNotFound(false);
    setPage('confirmation');
    window.history.pushState({ page: 'confirmation', orderId: o.orderId }, '', `/confirmation?orderId=${o.orderId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sync to MongoDB Atlas with automatic retries so orders are NEVER lost or stuck on one device
    const syncWithRetry = async (attempts = 3, delay = 1000): Promise<void> => {
      for (let i = 0; i < attempts; i++) {
        try {
          await api.orders.create(o);
          return;
        } catch (err) {
          if (i === attempts - 1) {
            console.error('Failed to sync order to server after retries:', err);
          } else {
            await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
          }
        }
      }
    };
    syncWithRetry().catch(() => {});
  }, []);

  // Close cart on page change
  useEffect(() => {
    setCartOpen(false);
  }, [page]);

  // Dynamic SEO Title & Meta Tags
  useEffect(() => {
    let title = 'Krisha Dry Fruits | Premium Almonds, Walnuts, Cashews, Dates, Figs & Hampers';
    let desc = 'Official online store of Krisha Dry Fruits, Yeshwanthpur, Bangalore. Buy authentic Kashmiri Mamra Badam, Snow White Walnuts, W180 King Cashews, Saudi Medjool Dates, and Afghan Anjeer with pan-India delivery.';
    let canonical = 'https://krishadryfruits.in/';

    switch (page) {
      case 'products':
        title = 'Buy Premium Dry Fruits Online | Almonds, Walnuts, Cashews, Dates & Figs';
        desc = 'Browse our complete catalog of hand-sorted dry fruits: Kashmiri Mamra Badam, California Almonds, Extra Light Walnuts, Goan Cashews, Medjool Dates, and festive hampers.';
        canonical = 'https://krishadryfruits.in/products';
        break;
      case 'grades':
        title = 'Dry Fruits Quality & Sourcing Guide | Kashmiri Mamra vs California, Cashew Grades';
        desc = 'Understand dry fruit quality standards: Mamra oil content, Cashew W-counts (W180 to W320), Snow White walnut halves, and Medjool dates.';
        canonical = 'https://krishadryfruits.in/grades';
        break;
      case 'about':
        title = 'About Krisha Dry Fruits | Direct Orchard Sourcing & Pure Heritage';
        desc = 'Learn about our passion for pure orchard harvests, farm-direct relationships across Kashmir, Goa, and California, and zero chemical polish.';
        canonical = 'https://krishadryfruits.in/about';
        break;
      case 'contact':
        title = 'Visit Yeshwanthpur Store & Helpline | Krisha Dry Fruits Bengaluru';
        desc = 'Visit Krisha Dry Fruits physical store in Yeshwanthpur, Bengaluru or shop online. Get 1-click Google Maps directions, helpline, and store timings.';
        canonical = 'https://krishadryfruits.in/contact';
        break;
      case 'product':
        if (selectedProduct) {
          title = `${selectedProduct.name} | Krisha Dry Fruits`;
          desc = `${selectedProduct.tagline} - Buy fresh hand-sorted dry fruits online from Krisha Dry Fruits, Yeshwanthpur, Bangalore.`;
          canonical = `https://krishadryfruits.in/product?id=${selectedProduct._id || selectedProduct.id}`;
        }
        break;
      case 'myorders':
        title = 'My Orders & Real-Time Tracking | Krisha Dry Fruits';
        canonical = 'https://krishadryfruits.in/myorders';
        break;
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);
  }, [page, selectedProduct]);

  // Derived filter options
  const availableCategories = CATEGORIES;

  const availableGrades = Array.from(
    new Set(products.filter((p) => p.active !== false).map((p) => (p.grade || '').trim()).filter(Boolean))
  );

  const availableVarieties = Array.from(
    new Set(
      products
        .filter((p) => p.active !== false)
        .flatMap((p) => (p.types || []).map((t) => t.type))
        .filter(Boolean)
    )
  );

  const availableOrigins = Array.from(
    new Set(
      products
        .filter((p) => p.active !== false)
        .map((p) => (p.origin ? p.origin.split(',')[0].trim() : ''))
        .filter(Boolean)
    )
  );

  // Multi-attribute filtering logic
  const filteredProducts = products.filter((p) => {
    if (p.active === false) return false;

    // 1. Category Filter (Supports single category or multi-category comma separated list)
    const activeCatList = selectedCategory
      ? selectedCategory.split(',').map((c) => c.trim().toLowerCase())
      : [];
    const pCat = (p.category || '').toLowerCase();

    const matchesCategory =
      !selectedCategory ||
      selectedCategory === 'all' ||
      activeCatList.includes(pCat) ||
      (activeCatList.includes('nuts') && ['almonds', 'cashews', 'walnuts', 'pistachios'].includes(pCat)) ||
      (activeCatList.includes('dates-figs') && ['dates', 'figs'].includes(pCat)) ||
      (activeCatList.includes('dried-fruits') && ['raisins', 'figs'].includes(pCat)) ||
      (activeCatList.includes('cashews') && (pCat === 'cashews' || p.grade?.toUpperCase().startsWith('W'))) ||
      (activeCatList.includes('almonds') && (pCat === 'almonds' || p.name.toLowerCase().includes('almond') || p.name.toLowerCase().includes('mamra') || p.name.toLowerCase().includes('badam'))) ||
      (activeCatList.includes('walnuts') && (pCat === 'walnuts' || p.name.toLowerCase().includes('walnut') || p.name.toLowerCase().includes('akhrot'))) ||
      (activeCatList.includes('pistachios') && (pCat === 'pistachios' || p.name.toLowerCase().includes('pistachio') || p.name.toLowerCase().includes('pista'))) ||
      (activeCatList.includes('dates') && (pCat === 'dates' || p.name.toLowerCase().includes('date') || p.name.toLowerCase().includes('khajoor'))) ||
      (activeCatList.includes('figs') && (pCat === 'figs' || p.name.toLowerCase().includes('fig') || p.name.toLowerCase().includes('anjeer'))) ||
      (activeCatList.includes('raisins') && (pCat === 'raisins' || p.name.toLowerCase().includes('raisin') || p.name.toLowerCase().includes('kishmish'))) ||
      (activeCatList.includes('berries-seeds') && (pCat === 'berries-seeds' || p.name.toLowerCase().includes('seed') || p.name.toLowerCase().includes('cranberry') || p.name.toLowerCase().includes('berry'))) ||
      (activeCatList.includes('gift-boxes') && (pCat === 'gift-boxes' || p.name.toLowerCase().includes('gift') || p.name.toLowerCase().includes('box') || p.name.toLowerCase().includes('hamper')));

    // 2. Search Query
    const matchesSearch = !searchQuery || (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.types && p.types.some((t) => t.type.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (p.healthBenefits && p.healthBenefits.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    // 3. Grade Filter
    const matchesGrade =
      !selectedGrade || selectedGrade === 'ALL' || p.grade.toUpperCase() === selectedGrade.toUpperCase();

    // 4. Variety Filter
    const matchesVariety =
      !selectedVariety ||
      selectedVariety === 'ALL' ||
      (p.types && p.types.some((t) => t.type.toLowerCase().includes(selectedVariety.toLowerCase())));

    // 5. Origin Location Filter
    let matchesLocation = true;
    if (selectedLocation) {
      const loc = selectedLocation.toLowerCase().trim();
      const origin = (p.origin || '').toLowerCase().trim();
      if (loc === 'all' || loc === '') {
        matchesLocation = true;
      } else {
        matchesLocation = origin.includes(loc) || loc.includes(origin);
      }
    }

    return matchesCategory && matchesSearch && matchesGrade && matchesVariety && matchesLocation;
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col pb-16 lg:pb-0">
        <Header
          onNavigate={navigate}
          onOpenCart={() => setCartOpen(true)}
          onSearch={handleSearch}
          onSelectCategory={handleSelectCategory}
          currentPage={page}
        />

        <main className="flex-1">
          {page === 'home' && (
            <>
              <Hero
                onShopNow={() => navigate('products')}
                onExploreGiftBoxes={() => handleSelectCategory('gift-boxes')}
                onSelectCategory={handleSelectCategory}
                selectedCategory={selectedCategory}
              />
              <CategoryShowcase
                onSelectCategory={handleSelectCategory}
                onExploreAll={() => {
                  setSelectedCategory(null);
                  setSelectedLocation(null);
                  setSelectedGrade(null);
                  setSelectedVariety(null);
                  navigate('products');
                }}
                selectedCategory={selectedCategory}
              />
              <ProductGrid
                products={selectedCategory ? filteredProducts : products.filter((p) => p.active !== false)}
                onView={viewProduct}
                loading={productsLoading}
                title={
                  selectedCategory
                    ? siteContent.categoryBanners?.find(
                        (b) =>
                          (b.categoryIds && b.categoryIds.join(',') === selectedCategory) ||
                          b.categoryId === selectedCategory
                      )?.title ||
                      (selectedCategory === 'nuts'
                        ? 'Premium Nuts Collection'
                        : selectedCategory === 'dates-figs'
                        ? 'Dates & Figs Collection'
                        : selectedCategory === 'dried-fruits'
                        ? 'Sun-Dried Fruits Collection'
                        : selectedCategory === 'berries-seeds'
                        ? 'Seeds & Trail Mixes Collection'
                        : selectedCategory === 'gift-boxes'
                        ? 'Gift Hampers & Keepsake Boxes'
                        : `${CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Curated'} Selection`)
                    : 'Best Sellers'
                }
                subtitle={
                  selectedCategory
                    ? undefined
                    : 'Handpicked harvest of our most cherished almonds, king cashews, roasted pistachios, and royal Medjool dates.'
                }
                onViewAll={() => {
                  setSelectedCategory(null);
                  setSelectedLocation(null);
                  setSelectedGrade(null);
                  setSelectedVariety(null);
                  navigate('products');
                }}
              />
              <Features />
              <GradeSelectorSection
                products={products}
                onSelectGrade={handleSelectGrade}
                onSelectCategory={handleSelectCategory}
                onExploreAll={() => {
                  setSelectedCategory(null);
                  setSelectedLocation(null);
                  setSelectedGrade(null);
                  setSelectedVariety(null);
                  navigate('products');
                }}
                onSelectLocation={handleSelectLocation}
              />
              <StoreLocationSection />
              <Testimonials />
            </>
          )}

          {page === 'products' && (
            <div className="pt-6 sm:pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Filter & Active Selection Bar */}
              <div className="mb-6 card p-4 sm:p-5 bg-white border border-brand-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-100">
                  <div>
                    <h1 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
                      Explore All Dry Fruits & Nuts
                    </h1>
                    <p className="text-xs text-brand-600 mt-0.5">
                      Select by dry fruit superfood category, origin (Kashmir, Goa, California, Saudi Arabia), or preparation style.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-brand-700 bg-cream-100 px-3 py-1.5 rounded-xl border border-brand-200 self-start sm:self-auto">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'harvest' : 'harvests'} available
                  </div>
                </div>

                {/* 1. Quick Category Scroll Strip (Single Line, Never Wraps) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      !selectedCategory || selectedCategory === 'all'
                        ? 'bg-brand-900 text-cream-50 shadow-xs'
                        : 'bg-cream-100 hover:bg-cream-200 text-brand-800'
                    }`}
                  >
                    ✨ All Products
                  </button>
                  {availableCategories.slice(0, 8).map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-brand-900 text-cream-50 font-bold shadow-xs'
                            : 'bg-cream-100 hover:bg-cream-200 text-brand-800'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name.split(' ')[0]}</span>
                        {cat.hindiName && (
                          <span className="text-[10px] opacity-75">({cat.hindiName})</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 2. Compact Structured Dropdown Filters (Scales to 1000s of items without clutter) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-brand-100/60">
                  {/* Category Dropdown */}
                  <div>
                    <label className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block mb-1">
                      Category
                    </label>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                      className="w-full text-xs py-2 px-3 bg-cream-50/70 border border-brand-200 rounded-xl text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
                    >
                      <option value="">All Categories ({availableCategories.length})</option>
                      {availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.hindiName ? `(${c.hindiName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Grade Dropdown */}
                  <div>
                    <label className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block mb-1">
                      Grade & Caliber
                    </label>
                    <select
                      value={selectedGrade || ''}
                      onChange={(e) => setSelectedGrade(e.target.value || null)}
                      className="w-full text-xs py-2 px-3 bg-cream-50/70 border border-brand-200 rounded-xl text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
                    >
                      <option value="">All Grades ({availableGrades.length})</option>
                      {availableGrades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Origin Dropdown */}
                  <div>
                    <label className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block mb-1">
                      Origin / Region
                    </label>
                    <select
                      value={selectedLocation || ''}
                      onChange={(e) => setSelectedLocation(e.target.value || null)}
                      className="w-full text-xs py-2 px-3 bg-cream-50/70 border border-brand-200 rounded-xl text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
                    >
                      <option value="">All Sourcing Origins ({availableOrigins.length})</option>
                      {availableOrigins.map((orig) => (
                        <option key={orig} value={orig}>
                          {orig}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Search Input */}
                  <div>
                    <label className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block mb-1">
                      Filter by Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search badam, kaju..."
                        className="w-full text-xs py-2 pl-3 pr-8 bg-cream-50/70 border border-brand-200 rounded-xl text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 placeholder:text-brand-400"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-900 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Filter Clear Bar */}
                {(selectedCategory || selectedGrade || selectedVariety || selectedLocation || searchQuery) && (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-brand-600 border-t border-brand-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-brand-800">Active Filters:</span>
                      {selectedCategory && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-900 font-medium text-[11px]">
                          Category: {availableCategories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                          <button onClick={() => setSelectedCategory(null)} className="hover:text-red-600 ml-0.5">✕</button>
                        </span>
                      )}
                      {selectedGrade && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-900 font-medium text-[11px]">
                          Grade: {selectedGrade}
                          <button onClick={() => setSelectedGrade(null)} className="hover:text-red-600 ml-0.5">✕</button>
                        </span>
                      )}
                      {selectedLocation && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-900 font-medium text-[11px]">
                          Origin: {selectedLocation}
                          <button onClick={() => setSelectedLocation(null)} className="hover:text-red-600 ml-0.5">✕</button>
                        </span>
                      )}
                      {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium text-[11px]">
                          "{searchQuery}"
                          <button onClick={() => setSearchQuery('')} className="hover:text-red-600 ml-0.5">✕</button>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedGrade(null);
                        setSelectedVariety(null);
                        setSelectedLocation(null);
                        setSearchQuery('');
                      }}
                      className="text-red-600 hover:text-red-800 font-semibold underline cursor-pointer shrink-0"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>

              <ProductGrid
                products={filteredProducts}
                onView={viewProduct}
                loading={productsLoading}
                title=""
              />
            </div>
          )}

          {page === 'product' && selectedProduct && (
            <ProductDetail
              product={selectedProduct}
              allProducts={products}
              onSelectProduct={viewProduct}
              onBack={() => navigate('products')}
              onNavigate={navigate}
              onOpenCart={() => setCartOpen(true)}
            />
          )}

          {page === 'product' && !selectedProduct && (
            <div className="max-w-md mx-auto py-24 px-4 text-center">
              <h3 className="font-serif text-xl font-bold text-brand-950">Product Not Found</h3>
              <p className="text-xs text-brand-500 mt-2 mb-6">
                The requested dry fruit harvest is unavailable or catalog is currently empty.
              </p>
              <button onClick={() => navigate('products')} className="btn-primary text-xs py-2 px-5">
                Return to Storefront
              </button>
            </div>
          )}

          {page === 'grades' && (
            <GradesGuide onShop={() => navigate('products')} onViewProduct={viewProductById} products={products} />
          )}

          {page === 'about' && <About />}

          {page === 'contact' && <Contact />}

          {page === 'myorders' && (
            <MyOrders
              onBack={() => navigate('home')}
              onShop={() => navigate('products')}
            />
          )}

          {page === 'checkout' && (
            <CheckoutPage
              onBack={() => {
                setCartOpen(true);
                navigate('products');
              }}
              onPlaceOrder={handlePlaceOrder}
            />
          )}

          {page === 'confirmation' && (
            order ? (
              <OrderConfirmation
                order={order}
                onContinueShopping={() => navigate('home')}
                onViewOrders={() => navigate('myorders')}
              />
            ) : orderNotFound ? (
              <div className="max-w-md mx-auto py-20 px-4 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-100/70 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-brand-950 mb-2">Order Confirmation Not Found</h3>
                <p className="text-xs sm:text-sm text-brand-600 mb-6 leading-relaxed">
                  We could not locate this order details. If you just placed an order, please visit your orders page to check its live status.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('myorders')}
                    className="w-full sm:w-auto btn-primary py-2.5 px-6 text-xs font-semibold"
                  >
                    Track My Orders
                  </button>
                  <button
                    onClick={() => navigate('home')}
                    className="w-full sm:w-auto btn-secondary py-2.5 px-6 text-xs font-semibold"
                  >
                    Return to Store
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto py-24 px-4 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-700 animate-spin mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-brand-950">Retrieving Order Details...</h3>
                <p className="text-xs text-brand-500 mt-1">Please wait while your verified order confirmation loads.</p>
              </div>
            )
          )}
        </main>

        <Footer onNavigate={navigate} />

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onCheckout={() => {
            setCartOpen(false);
            navigate('checkout');
          }}
        />

        {/* Mobile Fixed Bottom Navigation Bar */}
        <MobileBottomNav
          currentPage={page}
          onNavigate={navigate}
          onOpenCart={() => setCartOpen(true)}
          onOpenCategories={() => navigate('grades')}
        />
      </div>
    </CartProvider>
  );
}

export default App;
