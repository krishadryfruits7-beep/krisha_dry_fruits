import { useState, useMemo, useEffect } from 'react';
import { Star, ArrowLeft, Plus, Minus, Check, ShoppingBag, Truck, ShieldCheck, ChevronRight, ArrowRight, Lock, AlertCircle, Sparkles, Heart, Brain, Zap } from 'lucide-react';
import type { Product, CashewType, Quantity } from '@/types';
import { formatPrice } from '@/data';
import { useCart } from '@/cart-context';
import { useSiteContent } from '@/site-content';
import { useUser, useClerk } from '@/auth';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onNavigate: (page: string) => void;
  onOpenCart: () => void;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
}

const TYPE_LABELS: Record<string, { emoji: string; short: string }> = {
  'Raw':              { emoji: '○', short: 'Raw Natural' },
  'Roasted':          { emoji: '●', short: 'Golden Roast' },
  'Roasted & Salted': { emoji: '◆', short: 'Salted Crisp' },
  'Lightly Salted':   { emoji: '◇', short: 'Light Salt' },
  'Smoked':           { emoji: '♨', short: 'Hickory Smoked' },
  'Fried & Salted':   { emoji: '⚡', short: 'Crispy Fried' },
  'Pepper Spiced':    { emoji: '▲', short: 'Spicy Masala' },
  'Spiced':           { emoji: '▲', short: 'Spicy Masala' },
  'Honey Glazed':     { emoji: '★', short: 'Honey Glazed' },
  'Assorted 4-in-1':  { emoji: '🎁', short: '4-Jar Keepsake' },
  'Assorted 6-in-1':  { emoji: '👑', short: '6-Jar Shahi' },
};

function getFirstAvailablePrice(type?: any) {
  return (type?.prices || []).find((p: any) => typeof p.price === 'number' && p.price > 0);
}

export default function ProductDetail({
  product,
  onBack,
  onNavigate,
  onOpenCart,
  allProducts = [],
  onSelectProduct,
}: ProductDetailProps) {
  const { addItem } = useCart();
  const siteContent = useSiteContent();
  const { isSignedIn } = useUser();
  const clerk = useClerk();

  const firstType = (product.types || [])[0];
  const [selectedType, setSelectedType] = useState<CashewType>(firstType?.type as CashewType);
  const [selectedQty, setSelectedQty] = useState<Quantity>(() => {
    const valid = getFirstAvailablePrice(firstType);
    return (valid?.quantity || firstType?.prices?.[0]?.quantity) as Quantity;
  });
  const [activeImage, setActiveImage] = useState(0);
  const [count, setCount] = useState(1);
  const [added, setAdded] = useState(false);

  // Synchronize selections whenever viewed product changes
  useEffect(() => {
    const first = (product.types || [])[0];
    setSelectedType(first?.type as CashewType);
    const valid = getFirstAvailablePrice(first);
    setSelectedQty((valid?.quantity || first?.prices?.[0]?.quantity) as Quantity);
    setActiveImage(0);
    setCount(1);
    setAdded(false);
  }, [product.id, (product as any)._id]);

  // Related sibling products (either same category or complementary)
  const siblingProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    const prodKey = product._id || product.id;
    return allProducts.filter(
      (p) =>
        (p._id || p.id) !== prodKey &&
        p.active !== false &&
        (p.category === product.category || p.grade === product.grade)
    ).slice(0, 4);
  }, [allProducts, product]);

  const currentType = useMemo(
    () => (product.types || []).find((t) => t.type === selectedType) ?? firstType,
    [product, selectedType, firstType]
  );

  const availablePrices = useMemo(
    () => (currentType?.prices || []).filter((p) => typeof p.price === 'number' && p.price > 0),
    [currentType]
  );

  const currentPrice = useMemo(() => {
    if (availablePrices.length === 0) return null;
    return availablePrices.find((p) => p.quantity === selectedQty) ?? availablePrices[0];
  }, [availablePrices, selectedQty]);

  const gallery = useMemo(() => {
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (currentType?.image && !list.includes(currentType.image)) {
      list.push(currentType.image);
    }
    if (Array.isArray(product.gallery)) {
      product.gallery.filter(Boolean).forEach((g) => {
        if (!list.includes(g)) list.push(g);
      });
    }
    return list.length > 0 ? list : ['/cashew_single_nut.jpg'];
  }, [product, currentType]);

  const handleTypeChange = (type: CashewType) => {
    setSelectedType(type);
    const t = (product.types || []).find((x) => x.type === type);
    const valid = getFirstAvailablePrice(t);
    if (valid) {
      setSelectedQty(valid.quantity as Quantity);
    } else if (t?.prices?.[0]) {
      setSelectedQty(t.prices[0].quantity as Quantity);
    }
    if (t?.image) {
      const idx = gallery.indexOf(t.image);
      if (idx !== -1) setActiveImage(idx);
    }
    setAdded(false);
  };

  const handleGuestSignInAndAdd = () => {
    if (!currentPrice || currentPrice.price <= 0) return;
    const prodId = (product as any)._id || product.id;
    const returnPath = `/product?id=${prodId}`;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(
          'kdf_pending_cart_item',
          JSON.stringify({
            product,
            type: selectedType,
            quantity: selectedQty,
            price: currentPrice,
            image: currentType?.image || product.image,
            count,
          })
        );
        window.sessionStorage.setItem('kdf_auth_return_url', returnPath);
        window.sessionStorage.setItem('kdf_auth_return_product_id', prodId);
      }
    } catch (e) {
      console.warn('Failed to save pending cart state:', e);
    }

    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}${returnPath}` : returnPath;
    clerk?.openSignIn?.({
      fallbackRedirectUrl: redirectUrl,
      signUpFallbackRedirectUrl: redirectUrl,
    });
  };

  const handleAddToCart = () => {
    if (!currentType || !currentPrice || currentPrice.price <= 0) return;
    if (!isSignedIn) {
      handleGuestSignInAndAdd();
      return;
    }
    for (let i = 0; i < count; i++) {
      addItem(product, selectedType, selectedQty, currentPrice, currentType.image || product.image);
    }
    setAdded(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 sm:pb-14">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-brand-600/90 font-medium">
          <button onClick={onBack} className="hover:text-brand-950 transition-colors">
            All Dry Fruits
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-brand-300" />
          <span className="text-brand-500 font-medium capitalize">{product.categoryLabel || product.category || 'Harvests'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-brand-300" />
          <span className="text-brand-950 font-bold truncate max-w-[140px] sm:max-w-none">{product.name}</span>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-700 hover:text-brand-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        {/* Left Column: Image Showcase */}
        <div>
          <div className="relative rounded-3xl overflow-hidden shadow-luxury border border-brand-200/70 bg-white mb-4">
            <img
              src={gallery[activeImage] || product.image}
              alt={`${product.name} - ${selectedType}`}
              className="w-full h-[320px] sm:h-[450px] lg:h-[480px] object-cover transition-all duration-500"
            />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center rounded-full bg-brand-950/90 backdrop-blur-md px-3.5 py-1 text-xs font-semibold tracking-wide text-cream-50 border border-white/20 shadow-sm">
                {product.badge}
              </span>
            </div>
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm border border-brand-100">
              <span className="text-xs font-bold text-brand-900">{product.grade}</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mb-6">
              {gallery.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`rounded-2xl overflow-hidden ring-2 transition-all h-16 sm:h-20 bg-cream-200/50 ${
                    activeImage === i ? 'ring-brand-700 shadow-md' : 'ring-transparent hover:ring-brand-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Health & Nutritional Highlights Card */}
          {product.nutritionalHighlights && (
            <div className="card p-5 bg-cream-50/80 border border-brand-200/70 mb-6 space-y-3">
              <div className="flex items-center justify-between border-b border-brand-200/50 pb-2.5">
                <span className="font-serif text-sm font-bold text-brand-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-500" />
                  <span>Nutritional & Superfood Profile</span>
                </span>
                {product.nutritionalHighlights.keyNutrient && (
                  <span className="text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
                    {product.nutritionalHighlights.keyNutrient}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                {product.nutritionalHighlights.calories && (
                  <div className="p-2.5 rounded-xl bg-white border border-brand-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-brand-400 block">Energy</span>
                    <span className="text-xs font-bold text-brand-950">{product.nutritionalHighlights.calories}</span>
                  </div>
                )}
                {product.nutritionalHighlights.protein && (
                  <div className="p-2.5 rounded-xl bg-white border border-brand-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-brand-400 block">Protein</span>
                    <span className="text-xs font-bold text-brand-950">{product.nutritionalHighlights.protein}</span>
                  </div>
                )}
                {product.nutritionalHighlights.fiber && (
                  <div className="p-2.5 rounded-xl bg-white border border-brand-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-brand-400 block">Dietary Fiber</span>
                    <span className="text-xs font-bold text-brand-950">{product.nutritionalHighlights.fiber}</span>
                  </div>
                )}
                {product.nutritionalHighlights.healthyFats && (
                  <div className="p-2.5 rounded-xl bg-white border border-brand-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-brand-400 block">Healthy Fats</span>
                    <span className="text-xs font-bold text-brand-950">{product.nutritionalHighlights.healthyFats}</span>
                  </div>
                )}
              </div>

              {/* Health Benefits Bullet Points */}
              {product.healthBenefits && product.healthBenefits.length > 0 && (
                <div className="pt-2 border-t border-brand-200/50">
                  <div className="text-[11px] font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                    Health Benefits:
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-brand-700">
                    {product.healthBenefits.map((b, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Specifications & Configuration */}
        <div className="flex flex-col">
          {/* Header & Ratings */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-xs font-bold text-brand-800 tracking-wider">
                {product.grade}
              </span>
              {product.categoryLabel && (
                <span className="px-2.5 py-0.5 rounded-full bg-cream-200 text-xs font-semibold text-brand-700">
                  {product.categoryLabel}
                </span>
              )}
              {product.rating > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-800 ml-auto sm:ml-0">
                  <Star className="w-3.5 h-3.5 text-gold-500 fill-current" />
                  <span>{product.rating}</span>
                  {product.reviewCount > 0 && (
                    <span className="text-brand-500 font-normal">({product.reviewCount} reviews)</span>
                  )}
                </div>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-brand-950 mb-1.5 leading-tight tracking-tight">
              {product.name}
            </h1>
            <p className="text-sm sm:text-base text-brand-700/90 font-medium mb-2.5">
              {product.tagline}
            </p>

            {product.origin && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold mb-3">
                <span>📍 Harvest Origin: {product.origin}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-brand-800/80 leading-relaxed">
              {product.longDescription || product.description}
            </p>

            {/* Other Variations in same category */}
            {siblingProducts.length > 0 && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-xs">
                <div className="text-xs font-bold text-amber-950 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Explore Other Harvests in {product.categoryLabel || 'Collection'}:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {siblingProducts.map((sp) => {
                    const spPrices = (sp.types || [])
                      .flatMap((t) => (t.prices || []).map((pr) => pr.price))
                      .filter((p): p is number => typeof p === 'number' && p > 0);
                    const spMin = spPrices.length ? Math.min(...spPrices) : null;
                    return (
                      <button
                        key={sp._id || sp.id}
                        type="button"
                        onClick={() => onSelectProduct?.(sp)}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-left transition-all group shadow-xs cursor-pointer"
                      >
                        <img src={sp.image} alt={sp.name} className="w-10 h-10 rounded-lg object-cover ring-1 ring-amber-100 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-brand-950 group-hover:text-brand-700 truncate">{sp.name}</div>
                          <div className="text-[10.5px] text-forest-700 font-medium truncate">📍 {sp.origin ? sp.origin.split(',')[0].trim() : 'Orchard'}</div>
                          {spMin && <div className="text-[11px] font-semibold text-brand-900">from {formatPrice(spMin)}</div>}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Variety / Preparation Selector */}
          {product.types.length > 1 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs sm:text-sm font-bold text-brand-950 tracking-wide uppercase">
                  1. Choose Style / Variety
                </label>
                <span className="text-xs text-brand-500 font-medium">Selected: <strong className="text-brand-900">{selectedType}</strong></span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.types.map((t) => {
                  const label = TYPE_LABELS[t.type] ?? { emoji: '●', short: t.type };
                  const isSelected = selectedType === t.type;
                  const hasAvailableWeights = (t.prices || []).some((pr: any) => typeof pr.price === 'number' && pr.price > 0);
                  return (
                    <button
                      key={t.type}
                      onClick={() => handleTypeChange(t.type as CashewType)}
                      className={`relative flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-brand-700 bg-brand-100/70 shadow-sm ring-1 ring-brand-700'
                          : hasAvailableWeights
                          ? 'border-brand-200 bg-white hover:border-brand-400 hover:bg-cream-50'
                          : 'border-brand-200/60 bg-cream-100/40 opacity-75'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-cream-200/80 flex items-center justify-center text-xs font-bold text-brand-900 shrink-0">
                        {label.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-brand-950 truncate flex items-center gap-1.5">
                          <span>{t.type}</span>
                          {!hasAvailableWeights && (
                            <span className="text-[9px] font-semibold text-gray-500 bg-gray-200/70 px-1.5 py-0.2 rounded">
                              Out of stock
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-800 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {currentType?.description && (
                <div className="mt-2.5 text-xs text-brand-700 bg-cream-100/80 rounded-xl p-3 border border-brand-200/50 leading-relaxed">
                  {currentType.description}
                </div>
              )}
            </div>
          )}

          {/* Weight Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs sm:text-sm font-bold text-brand-950 tracking-wide uppercase">
                {product.category === 'gift-boxes' ? '2. Select Pack Option' : '2. Select Pack Weight'}
              </label>
              {availablePrices.length > 0 && (
                <span className="text-xs text-forest-700 font-semibold">Bulk tier savings applied</span>
              )}
            </div>

            {availablePrices.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {availablePrices.map((p) => {
                  const isSelected = selectedQty === p.quantity;
                  return (
                    <button
                      key={p.quantity}
                      onClick={() => { setSelectedQty(p.quantity); setAdded(false); }}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-brand-700 bg-brand-900 text-cream-50 shadow-md ring-2 ring-brand-700/20'
                          : 'border-brand-200 bg-white hover:border-brand-400 text-brand-900'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold font-mono">{p.quantity}</div>
                      <div className={`text-[11px] mt-0.5 font-bold ${isSelected ? 'text-amber-300' : 'text-brand-600'}`}>
                        {formatPrice(p.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>This variety has no available package weights at the moment. Please select another option above.</span>
              </div>
            )}
          </div>

          {/* Quantity Stepper & Price Calculation Card */}
          <div className="card p-5 bg-gradient-to-br from-cream-100/90 to-brand-50/70 border border-brand-200/80 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-brand-500 font-bold block">
                  {currentPrice && currentPrice.price > 0 ? `Total Investment (${selectedQty} × ${count})` : 'Product Availability'}
                </span>
                <div className="font-serif text-3xl font-bold text-brand-950">
                  {currentPrice && currentPrice.price > 0 ? formatPrice(currentPrice.price * count) : (
                    <span className="text-xl text-gray-500 font-medium">Out of Stock</span>
                  )}
                </div>
                {currentPrice && currentPrice.price > 0 && (
                  <div className="text-[11px] text-forest-700 font-medium mt-0.5">
                    ✓ Free delivery on orders over ₹1,200
                  </div>
                )}
              </div>

              {/* Counter Stepper */}
              {currentPrice && currentPrice.price > 0 && (
                <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-brand-200 shadow-sm">
                  <button
                    onClick={() => setCount((c) => Math.max(1, c - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cream-100 text-brand-800 active:scale-95 transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-serif text-sm font-bold text-brand-950 w-7 text-center">
                    {count}
                  </span>
                  <button
                    onClick={() => setCount((c) => c + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cream-100 text-brand-800 active:scale-95 transition-all"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Add to Cart Button */}
            {!currentPrice || currentPrice.price <= 0 ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 rounded-full bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                >
                  <span>Currently Out of Stock</span>
                </button>
                <p className="text-[11.5px] text-brand-500 text-center font-medium">
                  This weight tier or variety is currently not in stock. Please select another option above.
                </p>
              </div>
            ) : !isSignedIn ? (
              <div className="space-y-2">
                <button
                  onClick={handleGuestSignInAndAdd}
                  className="w-full btn-primary py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-md bg-amber-700 hover:bg-amber-800 text-cream-50"
                >
                  <Lock className="w-4 h-4 text-amber-200" />
                  <span>Sign In to Add to Cart • {currentPrice ? formatPrice(currentPrice.price * count) : ''}</span>
                </button>
                <p className="text-[11.5px] text-brand-600 text-center font-medium">
                  🔒 Sign in with Google to add products to your cart and track orders.
                </p>
              </div>
            ) : !added ? (
              <button
                onClick={handleAddToCart}
                className="w-full btn-primary py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-md shadow-brand-900/15"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add {count} {count === 1 ? 'Pack' : 'Packs'} to Cart • {currentPrice ? formatPrice(currentPrice.price * count) : ''}</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="w-full rounded-full bg-forest-700 py-3 text-sm font-semibold text-cream-50 flex items-center justify-center gap-2 shadow-sm animate-scale-in">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Added to Cart Successfully!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onNavigate('checkout')}
                    className="w-full rounded-full bg-brand-950 hover:bg-brand-900 py-3 text-xs sm:text-sm font-semibold text-cream-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Checkout Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onOpenCart}
                    className="w-full rounded-full bg-white hover:bg-cream-100 border border-brand-300 py-3 text-xs sm:text-sm font-semibold text-brand-900 transition-colors"
                  >
                    <span>View Cart</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-brand-200/60 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-brand-950">Express Dispatch</div>
                <div className="text-[10px] text-brand-500">Shipped within 48h</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-brand-200/60 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-brand-950">100% Quality Sealed</div>
                <div className="text-[10px] text-brand-500">Airtight nitrogen fresh pack</div>
              </div>
            </div>
          </div>

          {/* Sourcing & Specs Table */}
          <div className="border-t border-brand-200/60 pt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-brand-100/60">
              <span className="text-brand-500 font-medium">Harvest Origin</span>
              <span className="font-semibold text-brand-950">{product.origin}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-100/60">
              <span className="text-brand-500 font-medium">Quality & Caliber Standard</span>
              <span className="font-semibold text-brand-950">{product.gradeDescription}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-brand-500 font-medium">Available Varieties</span>
              <span className="font-semibold text-brand-950">{(product.types || []).map((t) => t.type).join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-200/80 p-3 px-4 shadow-luxury-xl">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <span className="text-[10px] text-brand-500 block uppercase font-bold tracking-wider">
              {selectedType} · {selectedQty}
            </span>
            <div className="font-serif text-xl font-bold text-brand-950">
              {currentPrice && currentPrice.price > 0 ? formatPrice(currentPrice.price * count) : 'Out of Stock'}
            </div>
          </div>

          {!currentPrice || currentPrice.price <= 0 ? (
            <button
              disabled
              className="rounded-full bg-gray-200 text-gray-500 py-3 px-6 text-xs sm:text-sm font-semibold cursor-not-allowed"
            >
              <span>Out of Stock</span>
            </button>
          ) : !isSignedIn ? (
            <button
              onClick={handleGuestSignInAndAdd}
              className="rounded-full bg-amber-700 hover:bg-amber-800 text-cream-50 py-3 px-6 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Lock className="w-4 h-4 text-amber-200" />
              <span>Sign In to Add</span>
            </button>
          ) : !added ? (
            <button
              onClick={handleAddToCart}
              className="btn-primary py-3 px-6 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-brand-950/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('checkout')}
              className="rounded-full bg-brand-950 text-cream-50 py-3 px-6 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <span>Go to Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
