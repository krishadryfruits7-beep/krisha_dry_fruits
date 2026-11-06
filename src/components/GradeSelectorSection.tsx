import { ArrowRight, ChevronRight, ChevronLeft, MapPin, Sparkles, Heart, Brain, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Product } from '@/types';
import { CATEGORIES, formatPrice } from '@/data';

interface GradeSelectorProps {
  onSelectGrade: (grade: string) => void;
  onExploreAll: () => void;
  onSelectLocation?: (locationKey: string) => void;
  onSelectCategory?: (category: string) => void;
  products?: Product[];
}

export default function GradeSelectorSection({
  onSelectGrade,
  onExploreAll,
  onSelectLocation,
  onSelectCategory,
  products = [],
}: GradeSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
  };

  // Group products by category to show dynamic counts and starting prices
  const categoryStats = CATEGORIES.map((cat) => {
    const matching = products.filter(
      (p) => (p.category === cat.id || p.name.toLowerCase().includes(cat.id.slice(0, 4))) && p.active !== false
    );
    const count = matching.length;
    let minPrice = Infinity;
    matching.forEach((p) => {
      p.types?.forEach((t) => {
        t.prices?.forEach((pr) => {
          if (pr.price > 0 && pr.price < minPrice) minPrice = pr.price;
        });
      });
    });
    return {
      ...cat,
      itemCount: count > 0 ? count : undefined,
      minPrice: minPrice !== Infinity ? minPrice : null,
    };
  });

  return (
    <section className="py-12 sm:py-16 bg-cream-100/70 border-b border-brand-200/50 relative overflow-hidden">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-forest-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-900 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Orchard Harvests & Pure Heritage</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-950 tracking-tight">
              Explore by Superfood Category
            </h2>
            <p className="text-xs sm:text-sm text-brand-700/90 mt-1 max-w-xl leading-relaxed">
              From high-altitude Kashmiri Mamra almonds and Snow White walnuts to Goan king cashews and royal Medjool dates — discover hand-curated vitality in every harvest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExploreAll}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-700 hover:text-brand-950 transition-colors cursor-pointer"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-brand-200">
              <button
                onClick={scrollLeft}
                className="w-8 h-8 rounded-full bg-white hover:bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-800 transition-colors shadow-2xs"
                aria-label="Scroll Categories Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                className="w-8 h-8 rounded-full bg-white hover:bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-800 transition-colors shadow-2xs"
                aria-label="Scroll Categories Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Horizontal Carousel */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x"
        >
          {categoryStats.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory ? onSelectCategory(cat.id) : onExploreAll()}
              className="w-64 sm:w-72 shrink-0 snap-start bg-white rounded-3xl border border-brand-200/80 p-4 shadow-luxury hover:shadow-luxury-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Category Cover Image with Badge */}
                <div className="relative h-40 rounded-2xl overflow-hidden bg-cream-200/50 mb-3.5">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {cat.badge && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center text-[10px] font-bold text-cream-50 bg-brand-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                        {cat.badge}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                    <span className="text-xl drop-shadow-md">{cat.icon}</span>
                    {cat.itemCount && (
                      <span className="text-[11px] font-semibold bg-white/90 text-brand-950 backdrop-blur-md px-2 py-0.5 rounded-md shadow-xs">
                        {cat.itemCount} {cat.itemCount === 1 ? 'harvest' : 'harvests'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Vernacular Tag */}
                <div className="flex items-baseline gap-1.5 mb-1">
                  <h3 className="font-serif text-lg font-bold text-brand-950 group-hover:text-brand-700 transition-colors">
                    {cat.name}
                  </h3>
                  {cat.hindiName && (
                    <span className="text-xs text-brand-500 font-semibold">({cat.hindiName})</span>
                  )}
                </div>

                <p className="text-xs text-forest-700 font-semibold mb-2">
                  📍 {cat.tagline}
                </p>

                <p className="text-[11.5px] text-brand-600 line-clamp-2 leading-relaxed mb-4">
                  {cat.description}
                </p>
              </div>

              {/* Footer with starting price & arrow */}
              <div className="pt-3 border-t border-brand-100 flex items-center justify-between">
                <div>
                  {cat.minPrice ? (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-brand-400 block tracking-wider">
                        Starting From
                      </span>
                      <span className="font-serif text-sm font-bold text-brand-950">
                        {formatPrice(cat.minPrice)} <span className="text-[10.5px] font-normal text-brand-500">/ 250g</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-brand-700">Explore Collection</span>
                  )}
                </div>

                <div className="w-8 h-8 rounded-full bg-cream-100 group-hover:bg-brand-900 group-hover:text-cream-50 text-brand-800 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 pt-8 border-t border-brand-200/60 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-brand-200/50">
            <span className="p-2 rounded-xl bg-forest-100 text-forest-800 text-sm">🌱</span>
            <div>
              <div className="text-xs font-bold text-brand-950">100% Raw & Natural</div>
              <div className="text-[11px] text-brand-600 leading-tight mt-0.5">Zero artificial chemical polish</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-brand-200/50">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 text-sm">🧠</span>
            <div>
              <div className="text-xs font-bold text-brand-950">Kashmiri Mamra & Akhrot</div>
              <div className="text-[11px] text-brand-600 leading-tight mt-0.5">High natural oil for brain health</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-brand-200/50">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800 text-sm">🌴</span>
            <div>
              <div className="text-xs font-bold text-brand-950">Royal Saudi Dates</div>
              <div className="text-[11px] text-brand-600 leading-tight mt-0.5">Medjool & Ajwa with 0% added sugar</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-brand-200/50">
            <span className="p-2 rounded-xl bg-brand-100 text-brand-800 text-sm">🛡️</span>
            <div>
              <div className="text-xs font-bold text-brand-950">Hand-Sorted in Bengaluru</div>
              <div className="text-[11px] text-brand-600 leading-tight mt-0.5">Airtight nitrogen fresh seal</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
