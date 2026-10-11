import { useState, useEffect, useCallback } from 'react';
import { CartProvider } from '@/cart-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
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
import { api } from '@/api';
import type { Product, OrderDetails } from '@/types';
import { saveCustomerOrder, getCustomerOrders } from '@/orders-storage';
import { useStoredProducts, syncWithServerProducts } from '@/products-storage';
import { syncWithServerContent } from '@/site-content';
import { syncWithServerReviews } from '@/reviews-storage';

type Page = 'home' | 'products' | 'grades' | 'about' | 'contact' | 'product' | 'checkout' | 'confirmation' | 'myorders';

function getInitialPage(): Page {
  if (typeof window === 'undefined') return 'home';
  const p = window.location.pathname.replace(/^\//, '').split('?')[0] as Page;
  const validPages: Page[] = ['home', 'products', 'grades', 'about', 'contact', 'product', 'checkout', 'confirmation', 'myorders'];
  return validPages.includes(p) ? p : 'home';
}

function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
        if (Array.isArray(data)) {
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

  // Recover selectedProduct if page is 'product' on mount or when products list changes
  useEffect(() => {
    if (page === 'product' && products.length > 0) {
      if (!selectedProduct) {
        const searchParams = new URLSearchParams(window.location.search);
        const prodId = searchParams.get('id') || window.history.state?.productId;
        const gradeParam = searchParams.get('grade');
        let found: Product | undefined;
        if (prodId) {
          found = products.find((p) => p.id === prodId || (p as any)._id === prodId);
        } else if (gradeParam) {
          found = products.find((p) => p.grade.toLowerCase() === gradeParam.toLowerCase());
        }
        if (found) {
          setSelectedProduct(found);
        } else {
          setSelectedProduct(products[0]);
        }
      }
    }
  }, [page, selectedProduct, products]);

  // Handle browser back/forward and recovery
  useEffect(() => {
    // Initialize history state on first mount
    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page: getInitialPage() }, '', window.location.href);
    }

    // Recover order if on confirmation page
    const initialPage = getInitialPage();
    if (initialPage === 'confirmation' && !order) {
      const searchParams = new URLSearchParams(window.location.search);
      const oId = searchParams.get('orderId') || searchParams.get('id');
      const allOrders = getCustomerOrders();
      if (oId) {
        const found = allOrders.find((x) => x.orderId === oId || (x as any)._id === oId);
        if (found) setOrder(found);
      } else if (allOrders.length > 0) {
        setOrder(allOrders[0]);
      }
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
        const allOrders = getCustomerOrders();
        if (oId) {
          const found = allOrders.find((x) => x.orderId === oId || (x as any)._id === oId);
          if (found) setOrder(found);
        } else if (allOrders.length > 0) {
          setOrder(allOrders[0]);
        }
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
    setPage('products');
  }, []);

  const handleSelectLocation = useCallback((locationKey: string) => {
    setSelectedLocation(locationKey);
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
    setPage('confirmation');
    window.history.pushState({ page: 'confirmation', orderId: o.orderId }, '', `/confirmation?orderId=${o.orderId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      await api.orders.create(o);
    } catch (err) {
      console.error('Failed to sync order to server:', err);
    }
  }, []);

  // Close cart on page change
  useEffect(() => {
    setCartOpen(false);
  }, [page]);

  const availableGrades = Array.from(
    new Set(products.filter((p) => p.active !== false).map((p) => (p.grade || '').trim().toUpperCase()).filter(Boolean))
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

  const filteredProducts = products.filter((p) => {
    if (p.active === false) return false;

    const matchesSearch = !searchQuery || (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.types && p.types.some((t) => t.type.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const matchesGrade =
      !selectedGrade || selectedGrade === 'ALL' || p.grade.toUpperCase() === selectedGrade.toUpperCase();

    const matchesVariety =
      !selectedVariety ||
      selectedVariety === 'ALL' ||
      (p.types && p.types.some((t) => t.type.toLowerCase().includes(selectedVariety.toLowerCase())));

    let matchesLocation = true;
    if (selectedLocation) {
      const loc = selectedLocation.toLowerCase().trim();
      const origin = (p.origin || '').toLowerCase().trim();
      if (loc === 'all' || loc === '') {
        matchesLocation = true;
      } else if (loc.includes('goa') && loc.includes('karnataka')) {
        matchesLocation = origin.includes('goa') || origin.includes('karnataka') || origin.includes('coast');
      } else {
        matchesLocation = origin.includes(loc) || loc.includes(origin);
      }
    }

    return matchesSearch && matchesGrade && matchesVariety && matchesLocation;
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Header
          onNavigate={navigate}
          onOpenCart={() => setCartOpen(true)}
          onSearch={handleSearch}
          currentPage={page}
        />

        <main className="flex-1">
          {page === 'home' && (
            <>
              <Hero onShopNow={() => navigate('products')} onLearnMore={() => navigate('grades')} />
              <Features />
              <GradeSelectorSection
                products={products}
                onSelectGrade={handleSelectGrade}
                onExploreAll={() => {
                  setSelectedLocation(null);
                  setSelectedGrade(null);
                  setSelectedVariety(null);
                  navigate('products');
                }}
                onSelectLocation={handleSelectLocation}
              />
              <ProductGrid
                products={products.filter((p) => p.active !== false)}
                onView={viewProduct}
                loading={productsLoading}
                title="Our Premium Cashew Collection"
                subtitle={
                  products.filter((p) => p.active !== false).length > 0
                    ? `${availableGrades.length} artisanal grades • ${products.filter((p) => p.active !== false).length} distinct harvests & preparations across Goa & Karnataka.`
                    : undefined
                }
              />
              <StoreLocationSection />
              <Testimonials />
            </>
          )}

          {page === 'products' && (
            <div className="pt-6 sm:pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Filter & Active Selection Bar */}
              <div className="mb-6 card p-4 sm:p-5 bg-white border border-brand-200/80 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-100">
                  <div>
                    <h1 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
                      Explore All Cashew Harvests
                    </h1>
                    <p className="text-xs text-brand-600 mt-0.5">
                      Filter by cashew grading caliber, cooking variety (raw, roasted, fried), or plantation origin.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-brand-700 bg-cream-100 px-3 py-1.5 rounded-xl border border-brand-200 self-start sm:self-auto">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'cashew harvest' : 'cashew harvests'} available
                  </div>
                </div>

                {/* Grade Filters */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-brand-500 uppercase tracking-wider min-w-[70px]">
                    Grade:
                  </span>
                  <button
                    onClick={() => setSelectedGrade(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      !selectedGrade
                        ? 'bg-brand-900 text-cream-50 font-bold shadow-xs'
                        : 'bg-cream-100 hover:bg-cream-200 text-brand-800'
                    }`}
                  >
                    All Grades
                  </button>
                  {availableGrades.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(selectedGrade === g ? null : g)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                        selectedGrade === g
                          ? 'bg-brand-900 text-cream-50 font-bold shadow-xs'
                          : 'bg-cream-100 hover:bg-cream-200 text-brand-800'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                {/* Variety Filters */}
                {availableVarieties.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs pt-2 border-t border-brand-100/60">
                    <span className="text-[11px] font-bold text-brand-500 uppercase tracking-wider min-w-[70px]">
                      Variety:
                    </span>
                    <button
                      onClick={() => setSelectedVariety(null)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        !selectedVariety
                          ? 'bg-brand-900 text-cream-50 font-bold shadow-xs'
                          : 'bg-cream-100 hover:bg-cream-200 text-brand-800'
                      }`}
                    >
                      All Varieties
                    </button>
                    {availableVarieties.map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariety(selectedVariety === v ? null : v)}
                        className={`px-3 py-1 rounded-lg text-xs transition-all ${
                          selectedVariety === v
                            ? 'bg-brand-900 text-cream-50 font-bold shadow-xs'
                            : 'bg-cream-100 hover:bg-cream-200 text-brand-800'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}

                {/* Origin Filters */}
                {availableOrigins.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs pt-2 border-t border-brand-100/60">
                    <span className="text-[11px] font-bold text-brand-500 uppercase tracking-wider min-w-[70px]">
                      Origin:
                    </span>
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        !selectedLocation
                          ? 'bg-forest-800 text-white font-bold shadow-xs'
                          : 'bg-cream-100 hover:bg-cream-200 text-brand-800'
                      }`}
                    >
                      All Origins
                    </button>
                    {availableOrigins.map((orig) => (
                      <button
                        key={orig}
                        onClick={() => setSelectedLocation(selectedLocation === orig ? null : orig)}
                        className={`px-3 py-1 rounded-lg text-xs transition-all ${
                          selectedLocation === orig
                            ? 'bg-forest-800 text-white font-bold shadow-xs'
                            : 'bg-cream-100 hover:bg-cream-200 text-brand-800'
                        }`}
                      >
                        📍 {orig}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Filter Clear */}
                {(selectedGrade || selectedVariety || selectedLocation || searchQuery) && (
                  <div className="pt-2 flex items-center justify-between text-xs text-brand-600 border-t border-brand-100">
                    <span>
                      Filtered by:{' '}
                      {[
                        selectedGrade ? `Grade ${selectedGrade}` : null,
                        selectedVariety ? `Variety: ${selectedVariety}` : null,
                        selectedLocation ? `Origin: ${selectedLocation}` : null,
                        searchQuery ? `Search: "${searchQuery}"` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedGrade(null);
                        setSelectedVariety(null);
                        setSelectedLocation(null);
                        setSearchQuery('');
                      }}
                      className="text-red-600 hover:text-red-800 font-semibold underline"
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
                The requested cashew harvest is unavailable or catalog is currently empty.
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
      </div>
    </CartProvider>
  );
}

export default App;