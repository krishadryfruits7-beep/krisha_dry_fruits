import { useState } from 'react';
import { Check, ArrowRight, Sparkles, BookOpen, Brain, Heart, Leaf, ShieldCheck } from 'lucide-react';
import { GRADES, CATEGORIES, formatPrice } from '@/data';
import type { Product } from '@/types';

interface GradesGuideProps {
  onShop: () => void;
  onViewProduct: (id: string) => void;
  products?: Product[];
}

export default function GradesGuide({ onShop, onViewProduct, products = [] }: GradesGuideProps) {
  const [activeTab, setActiveTab] = useState<'cashews' | 'almonds' | 'walnuts' | 'dates' | 'figs'>('cashews');

  const filteredProducts = products.filter(
    (p) => (p.category === activeTab || p.name.toLowerCase().includes(activeTab.slice(0, 4))) && p.active !== false
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-900 text-[11px] font-bold uppercase tracking-wider mb-3">
          <BookOpen className="w-3.5 h-3.5 text-brand-600" />
          <span>The Connoisseur's Handbook</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-950 tracking-tight mb-3">
          Sourcing, Caliber & Grading Standards
        </h1>
        <p className="text-xs sm:text-sm text-brand-700/90 leading-relaxed max-w-2xl mx-auto">
          Every dry fruit in our Yeshwanthpur shop follows rigid origin standards. Understand what makes Kashmiri Mamra distinct from California almonds, how cashew W-counts work, and why high-altitude walnut halves are sweeter.
        </p>
      </div>

      {/* Guide Category Switcher Tabs */}
      <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'cashews', label: 'Cashews (Kaju)', icon: '🥜' },
          { id: 'almonds', label: 'Almonds (Badam)', icon: '🌰' },
          { id: 'walnuts', label: 'Walnuts (Akhrot)', icon: '🧠' },
          { id: 'dates', label: 'Royal Dates (Khajoor)', icon: '🌴' },
          { id: 'figs', label: 'Afghan Figs (Anjeer)', icon: '🍂' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-brand-900 text-cream-50 shadow-md ring-2 ring-brand-700/30'
                : 'bg-white hover:bg-cream-100 text-brand-800 border border-brand-200/70 shadow-2xs'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Deep-Dive Educational Cards for Selected Tab */}
      <div className="mb-12">
        {activeTab === 'cashews' && (
          <div className="card p-6 sm:p-8 bg-white border border-brand-200/80 shadow-luxury space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-100">
              <div>
                <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">The Caliber Rule</span>
                <h2 className="font-serif text-2xl font-bold text-brand-950 mt-0.5">
                  How Cashew Nut Grading (W180 to W450) Works
                </h2>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-950 max-w-sm">
                Rule of Thumb: <strong className="text-amber-900">Smaller number = Larger, heavier, more luxurious nut.</strong>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-cream-50 border border-brand-200/60">
                <div className="font-serif text-xl font-bold text-brand-900">W180 — King Grade</div>
                <div className="text-[11px] font-bold text-forest-700 mt-0.5">170–180 nuts/lb</div>
                <p className="text-xs text-brand-600 mt-2 leading-relaxed">
                  The largest cashew kernel harvested. Extra thick, exceptionally creamy, prized for VIP gifting.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-brand-200/60">
                <div className="font-serif text-xl font-bold text-brand-900">W210 — Royal Jumbo</div>
                <div className="text-[11px] font-bold text-forest-700 mt-0.5">200–210 nuts/lb</div>
                <p className="text-xs text-brand-600 mt-2 leading-relaxed">
                  Jumbo caliber with beautiful crescent curvature and dense crunch.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-brand-200/60">
                <div className="font-serif text-xl font-bold text-brand-900">W240 — Premium Large</div>
                <div className="text-[11px] font-bold text-forest-700 mt-0.5">220–240 nuts/lb</div>
                <p className="text-xs text-brand-600 mt-2 leading-relaxed">
                  The premier choice for festive dry fruit platters, roasted snacks, and rich kaju sweets.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-brand-200/60">
                <div className="font-serif text-xl font-bold text-brand-900">W320 — Benchmark Classic</div>
                <div className="text-[11px] font-bold text-forest-700 mt-0.5">300–320 nuts/lb</div>
                <p className="text-xs text-brand-600 mt-2 leading-relaxed">
                  The global standard for taste and daily vitality. Balanced sweetness and delightful crispness.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'almonds' && (
          <div className="card p-6 sm:p-8 bg-white border border-brand-200/80 shadow-luxury space-y-6">
            <div className="pb-6 border-b border-brand-100">
              <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">Heritage Comparison</span>
              <h2 className="font-serif text-2xl font-bold text-brand-950 mt-0.5">
                Kashmiri Mamra Badam vs. California Nonpareil Almonds
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-cream-50 border-2 border-brand-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-lg font-bold text-brand-950">Authentic Kashmiri Mamra</h3>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                    👑 Royalty of Almonds
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-brand-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                    <span><strong>Natural Oil Content:</strong> Over 45% to 50% natural almond oil.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                    <span><strong>Distinct Look:</strong> Small, concave center with irregular wild contours.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                    <span><strong>Ayurvedic Virtue:</strong> Unequaled brain tonic, memory booster, and skin glow.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-cream-50 border border-brand-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-lg font-bold text-brand-950">California Nonpareil Extra</h3>
                  <span className="text-[10px] font-bold text-forest-900 bg-forest-100 px-2 py-0.5 rounded-full">
                    Crunch Favorite
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-brand-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                    <span><strong>Crunch & Flavor:</strong> Sweet, crisp, smooth paper-thin skin.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                    <span><strong>Uniformity:</strong> Large, clean, light-colored kernels perfect for snacks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                    <span><strong>Daily Fitness:</strong> High plant-protein (21g/100g) for active workout lifestyles.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'walnuts' && (
          <div className="card p-6 sm:p-8 bg-white border border-brand-200/80 shadow-luxury space-y-4">
            <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">Himalayan Purity</span>
            <h2 className="font-serif text-2xl font-bold text-brand-950">
              Kashmiri Snow White Halves vs Commercial Amber Akhrot
            </h2>
            <p className="text-xs sm:text-sm text-brand-700 leading-relaxed">
              Commercial store-bought walnuts often taste dark, bitter, and oily due to prolonged storage and oxidation. At Krisha Dry Fruits, our <strong>Kashmiri Snow White Akhrot Giri</strong> is freshly hand-cracked in high-altitude valleys, ensuring pale ivory color, crisp bite, and zero bitter tannin. Packed with pure plant-based <strong>Omega-3 ALA</strong> for arterial elasticity and brain vitality.
            </p>
          </div>
        )}

        {activeTab === 'dates' && (
          <div className="card p-6 sm:p-8 bg-white border border-brand-200/80 shadow-luxury space-y-4">
            <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">Desert Elixirs</span>
            <h2 className="font-serif text-2xl font-bold text-brand-950">
              Royal Medjool Jumbo vs. Holy Al-Madinah Ajwa Dates
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-brand-700 pt-2">
              <div className="p-4 rounded-xl bg-cream-50 border border-brand-200">
                <span className="font-serif font-bold text-base text-brand-950 block mb-1">Medjool King</span>
                <span>Giant, succulent caramel-soft dates. Natural substitute for refined sugar in desserts, coffee, and workout fuel.</span>
              </div>
              <div className="p-4 rounded-xl bg-cream-50 border border-brand-200">
                <span className="font-serif font-bold text-base text-brand-950 block mb-1">Madinah Ajwa</span>
                <span>Dark, velvety sacred dates renowned for cardioprotective polyphenols, iron enrichment, and anti-inflammatory properties.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'figs' && (
          <div className="card p-6 sm:p-8 bg-white border border-brand-200/80 shadow-luxury space-y-4">
            <span className="text-xs uppercase font-bold text-brand-500 tracking-wider">Wild Alpine Harvest</span>
            <h2 className="font-serif text-2xl font-bold text-brand-950">
              Afghani Kandahar Garland Anjeer
            </h2>
            <p className="text-xs sm:text-sm text-brand-700 leading-relaxed">
              Threaded on organic wild cotton strings, these jumbo sun-dried figs from Kandahar retain high concentrations of dietary fiber (9.8g/100g), bioavailable calcium, and iron. Soaking 2–3 figs overnight in fresh water remains the premier natural Ayurvedic regimen for optimal digestive rhythm and bone strength.
            </p>
          </div>
        )}
      </div>

      {/* Matching In-Stock Products in this category */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
            Available Harvests in {activeTab.toUpperCase()}
          </h3>
          <button
            onClick={onShop}
            className="text-xs font-bold text-brand-700 hover:text-brand-950 flex items-center gap-1"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {filteredProducts.map((product, i) => {
            const allPrices = (product.types || [])
              .flatMap((t) => (t.prices || []).map((p) => p.price))
              .filter((p): p is number => typeof p === 'number' && p > 0);
            const minPrice = allPrices.length ? Math.min(...allPrices) : null;

            return (
              <div
                key={product.id || (product as any)._id}
                className="card p-5 sm:p-6 hover:shadow-luxury-lg transition-all flex flex-col md:flex-row gap-5 items-center border border-brand-200/80"
              >
                <div className="flex items-center gap-4 md:w-56 shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-cream-200/60 shrink-0 border border-brand-200">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-serif text-base font-bold text-brand-950">{product.grade}</span>
                      {product.origin && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-200">
                          📍 {product.origin.split(',')[0]}
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-brand-600 line-clamp-1 mt-0.5">{product.gradeDescription}</div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-base sm:text-lg font-bold text-brand-950 mb-1">{product.name}</h4>
                  <p className="text-xs text-brand-700/80 leading-relaxed mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(product.types || []).slice(0, 4).map((t) => (
                      <span key={t.type} className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-0.5 text-[11px] font-medium text-brand-700 border border-brand-200/60">
                        <Check className="w-3 h-3 text-forest-600" />
                        {t.type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-center md:text-right shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-brand-100 w-full md:w-auto flex md:flex-col items-center md:items-end justify-between">
                  <div>
                    {minPrice ? (
                      <div>
                        <div className="text-[10.5px] text-brand-400 font-bold uppercase tracking-wider">From</div>
                        <div className="font-serif text-xl font-bold text-brand-950">{formatPrice(minPrice)}</div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-gray-400">Out of Stock</div>
                    )}
                  </div>
                  <button
                    onClick={() => onViewProduct((product as any)._id || product.id)}
                    className="btn-primary py-2 px-5 text-xs font-bold shadow-xs mt-2 md:mt-2"
                  >
                    <span>View & Select</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
