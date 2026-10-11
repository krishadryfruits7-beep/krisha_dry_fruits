import { useState, useMemo } from 'react';
import { Star, ArrowLeft, Plus, Minus, Check, ShoppingBag, Truck, ShieldCheck, ChevronRight, ArrowRight } from 'lucide-react';
import type { Product, CashewType, Quantity } from '@/types';
import { formatPrice } from '@/data';
import { useCart } from '@/cart-context';
import { useSiteContent } from '@/site-content';

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
  'Fried & Salted':   { emoji: '⚡', short: 'Crispy Fried' },
  'Pepper Spiced':    { emoji: '▲', short: 'Spicy Masala' },
  'Spiced':           { emoji: '▲', short: 'Spicy Masala' },
  'Honey Glazed':     { emoji: '★', short: 'Honey Glazed' },
};

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

  const firstType = product.types[0];
  const [selectedType, setSelectedType] = useState<CashewType>(firstType?.type as CashewType);
  const [selectedQty, setSelectedQty] = useState<Quantity>(firstType?.prices[0]?.quantity as Quantity);
  const [activeImage, setActiveImage] = useState(0);
  const [count, setCount] = useState(1);
  const [added, setAdded] = useState(false);

  const siblingProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    const prodKey = product._id || product.id;
    return allProducts.filter(
      (p) =>
        p.grade.toUpperCase() === product.grade.toUpperCase() &&
        (p._id || p.id) !== prodKey &&
        p.active !== false
    );
  }, [allProducts, product]);

  const currentType = useMemo(
    () => product.types.find((t) => t.type === selectedType) ?? firstType,
    [product, selectedType, firstType]
  );

  const currentPrice = useMemo(
    () => currentType?.prices.find((p) => p.quantity === selectedQty) ?? currentType?.prices[0],
    [currentType, selectedQty]
  );

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
    const t = product.types.find((t) => t.type === type);
    if (t?.prices[0]) setSelectedQty(t.prices[0].quantity as Quantity);
    if (t?.image) {
      const idx = gallery.indexOf(t.image);
      if (idx !== -1) setActiveImage(idx);
    }
    setAdded(false);
  };

  const handleAddToCart = () => {
    if (!currentType || !currentPrice) return;
    for (let i = 0; i < count; i++) {
      addItem(product, selectedType, selectedQty, currentPrice, currentType.image || product.image);
    }
    setAdded(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 sm:pb-12">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-brand-600/90 font-medium">
          <button onClick={onBack} className="hover:text-brand-950 transition-colors">
            Cashews
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-brand-300" />
          <span className="text-brand-400 font-normal">{product.grade}</span>
          <ChevronRight className="w-3.5 h-3.5 text-brand-300" />
          <span className="text-brand-950 font-semibold truncate max-w-[140px] sm:max-w-none">{product.name}</span>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-700 hover:text-brand-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Grades</span>
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
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm border border-brand-100">
              <span className="text-xs font-bold text-brand-900">{product.grade} Grade</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
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
        </div>

        {/* Right Column: Specifications & Configuration */}
        <div className="flex flex-col">
          {/* Header & Ratings */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-xs font-bold text-brand-800 tracking-wider">
                {product.grade} Standard
              </span>
              {product.rating > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-800">
                  <Star className="w-3.5 h-3.5 text-gold-500 fill-current" />
                  <span>{product.rating}</span>
                  {product.reviewCount > 0 && (
                    <span className="text-brand-500 font-normal">({product.reviewCount} customer reviews)</span>
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

            {/* Other Variations & Harvests for Same Grade */}
            {siblingProducts.length > 0 && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-xs">
                <div className="text-xs font-bold text-amber-950 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span>🌾 Other Styles & Harvests for Grade {product.grade}:</span>
                  <span className="text-[10px] font-normal text-amber-700 font-sans">({siblingProducts.length} more available)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {siblingProducts.map((sp) => {
                    const spPrices = sp.types.flatMap((t) => t.prices.map((pr) => pr.price)).filter(Boolean);
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
                          <div className="text-[10.5px] text-forest-700 font-medium truncate">📍 {sp.origin ? sp.origin.split(',')[0].trim() : 'Coastal'}</div>
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

          {/* Variety Selector */}
          {product.types.length > 1 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs sm:text-sm font-bold text-brand-950 tracking-wide uppercase">
                  1. Choose Variety
                </label>
                <span className="text-xs text-brand-500 font-medium">Selected: <strong className="text-brand-900">{selectedType}</strong></span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.types.map((t) => {
                  const label = TYPE_LABELS[t.type] ?? { emoji: '●', short: t.type };
                  const isSelected = selectedType === t.type;
                  return (
                    <button
                      key={t.type}
                      onClick={() => handleTypeChange(t.type as CashewType)}
                      className={`relative flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-brand-700 bg-brand-100/70 shadow-sm ring-1 ring-brand-700'
                          : 'border-brand-200 bg-white hover:border-brand-400 hover:bg-cream-50'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-cream-200/80 flex items-center justify-center text-xs font-bold text-brand-900 shrink-0">
                        {label.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-brand-950 truncate">{t.type}</div>
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
                2. Select Pack Weight
              </label>
              <span className="text-xs text-forest-700 font-semibold">Bulk discount applied</span>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {currentType?.prices.map((p) => {
                const isSelected = selectedQty === p.quantity;
                return (
                  <button
                    key={p.quantity}
                    onClick={() => { setSelectedQty(p.quantity as Quantity); setAdded(false); }}
                    className={`flex-1 min-w-[70px] sm:min-w-[85px] py-2 sm:py-2.5 px-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-brand-800 bg-brand-800 text-cream-50 font-bold shadow-sm'
                        : 'border-brand-200 bg-white text-brand-900 hover:border-brand-400 font-medium'
                    }`}
                  >
                    <div className="text-xs sm:text-sm">{p.quantity}</div>
                    <div className={`text-[10.5px] ${isSelected ? 'text-cream-200' : 'text-brand-600 font-semibold'}`}>
                      {formatPrice(p.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Stepper & Price Calculation Card */}
          <div className="card p-5 bg-gradient-to-br from-cream-100/90 to-brand-50/70 border border-brand-200/80 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-brand-500 font-bold block">
                  Total Investment ({selectedQty} × {count})
                </span>
                <div className="font-serif text-3xl font-bold text-brand-950">
                  {currentPrice ? formatPrice(currentPrice.price * count) : '—'}
                </div>
                <div className="text-[11px] text-forest-700 font-medium mt-0.5">
                  ✓ Free delivery on orders over ₹2,000
                </div>
              </div>

              {/* Counter Stepper */}
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
            </div>

            {/* Desktop Add to Cart Button */}
            {!added ? (
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
                <div className="text-xs font-bold text-brand-950">Express Delivery</div>
                <div className="text-[10px] text-brand-500">Dispatched in 48 hours</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-brand-200/60 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-brand-950">
                  {siteContent.contact?.showFssai !== false && Boolean(siteContent.contact?.fssaiNumber?.trim())
                    ? 'FSSAI Certified'
                    : 'Quality Assured'}
                </div>
                <div className="text-[10px] text-brand-500">100% Quality Guarantee</div>
              </div>
            </div>
          </div>

          {/* Origin & Specs */}
          <div className="border-t border-brand-200/60 pt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-brand-100/60">
              <span className="text-brand-500 font-medium">Harvest Origin</span>
              <span className="font-semibold text-brand-950">{product.origin}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-100/60">
              <span className="text-brand-500 font-medium">Nut Count Standard</span>
              <span className="font-semibold text-brand-950">{product.gradeDescription}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-brand-500 font-medium">Available Varieties</span>
              <span className="font-semibold text-brand-950">{product.types.map((t) => t.type).join(', ')}</span>
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
              {currentPrice ? formatPrice(currentPrice.price * count) : '—'}
            </div>
          </div>

          {!added ? (
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
