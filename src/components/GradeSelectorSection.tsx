import { ArrowRight, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Product } from '@/types';
import { useSiteContent } from '@/site-content';
import { formatPrice } from '@/data';

interface GradeSelectorProps {
  onSelectGrade: (grade: string) => void;
  onExploreAll: () => void;
  onSelectLocation?: (locationKey: string) => void;
  products?: Product[];
}

export interface GradeCardItem {
  grade: string;
  label: string;
  scale: string;
  image?: string;
  minPrice?: number;
  productCount?: number;
  varietiesSummary?: string;
}


export default function GradeSelectorSection({
  onSelectGrade,
  onExploreAll,
  onSelectLocation,
  products = [],
}: GradeSelectorProps) {
  const content = useSiteContent();
  const gradesScrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Derive dynamic grade cards from actual database/products if available
  const gradeCards: GradeCardItem[] = (() => {
    if (!products || products.length === 0) return [];

    // Group products by unique grade
    const gradeMap = new Map<string, {
      grade: string;
      label: string;
      image?: string;
      minPrice: number;
      productCount: number;
      varieties: Set<string>;
      origins: Set<string>;
    }>();

    products.forEach((p) => {
      if (!p.grade || p.active === false) return;
      const g = p.grade.trim().toUpperCase();

      let minP = Infinity;
      p.types?.forEach((t) => {
        t.prices?.forEach((pr) => {
          if (pr.price > 0 && pr.price < minP) minP = pr.price;
        });
      });

      let defaultLabel = 'Premium Grade';
      if (g === 'W180') defaultLabel = 'King Size';
      else if (g === 'W210') defaultLabel = 'Large';
      else if (g === 'W240') defaultLabel = 'Medium Large';
      else if (g === 'W320') defaultLabel = 'Standard';
      else if (g === 'W450') defaultLabel = 'Small Whole';
      else if (p.tagline) defaultLabel = p.tagline.split('—')[0].trim();

      if (!gradeMap.has(g)) {
        gradeMap.set(g, {
          grade: g,
          label: defaultLabel,
          image: p.image || '/cashew_single_nut.jpg',
          minPrice: minP !== Infinity ? minP : 0,
          productCount: 1,
          varieties: new Set((p.types || []).map((t) => t.type)),
          origins: new Set(p.origin ? [p.origin.split(',')[0].trim()] : []),
        });
      } else {
        const existing = gradeMap.get(g)!;
        existing.productCount += 1;
        if (minP > 0 && (existing.minPrice === 0 || minP < existing.minPrice)) {
          existing.minPrice = minP;
        }
        (p.types || []).forEach((t) => existing.varieties.add(t.type));
        if (p.origin) existing.origins.add(p.origin.split(',')[0].trim());
      }
    });

    const list = Array.from(gradeMap.values());
    if (list.length === 0) return [];

    return list.map((item, idx) => {
      const scales = ['scale-105', 'scale-100', 'scale-95', 'scale-90', 'scale-[0.82]'];
      const scale = scales[idx % scales.length] || 'scale-90';

      return {
        grade: item.grade,
        label: item.label,
        scale,
        image: item.image,
        minPrice: item.minPrice > 0 ? item.minPrice : undefined,
        productCount: item.productCount,
      };
    });
  })();

  const locationBanners = content.locationBanners || [];
  const totalBanners = locationBanners.length;

  const nextSlide = () => {
    if (totalBanners === 0) return;
    setActiveSlide((prev) => (prev + 1) % totalBanners);
  };

  const prevSlide = () => {
    if (totalBanners === 0) return;
    setActiveSlide((prev) => (prev - 1 + totalBanners) % totalBanners);
  };

  // Swipe gesture handling
  const minSwipeDistance = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
  };

  const scrollGrades = (direction: 'left' | 'right') => {
    if (gradesScrollRef.current) {
      gradesScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  const currentBanner = locationBanners[activeSlide] || locationBanners[0];

  const handleBannerClick = () => {
    const locKey = currentBanner.locationKey || currentBanner.tag;
    if (onSelectLocation) {
      onSelectLocation(locKey);
    } else {
      onExploreAll();
    }
  };

  return (
    <section className="bg-cream-50/60 py-8 sm:py-14 border-b border-brand-200/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <div className="text-[10.5px] sm:text-xs font-bold uppercase tracking-[0.2em] text-brand-500 mb-1.5">
              Premium Grades Collection
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-950 tracking-tight">
              Find Your Perfect Cashew
            </h2>
            <p className="text-xs sm:text-sm text-brand-700/90 max-w-xl leading-relaxed mt-1">
              From mammoth W180 King Size to delicate gourmet sizes — all sourced straight from coastal orchards.
            </p>
          </div>

          {/* Scroll Nav Buttons for desktop grades */}
          {gradeCards.length > 4 && (
            <div className="hidden sm:flex items-center gap-1.5 pb-1">
              <button
                onClick={() => scrollGrades('left')}
                className="w-8 h-8 rounded-full border border-brand-300/80 bg-white/80 hover:bg-brand-100 flex items-center justify-center text-brand-700 transition-colors shadow-sm"
                aria-label="Scroll grades left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollGrades('right')}
                className="w-8 h-8 rounded-full border border-brand-300/80 bg-white/80 hover:bg-brand-100 flex items-center justify-center text-brand-700 transition-colors shadow-sm"
                aria-label="Scroll grades right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Grade Cards: Horizontally scrollable track */}
        {gradeCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-300/80 bg-white/70 py-8 px-4 text-center">
            <p className="text-sm font-semibold text-brand-900">No Cashew Grades Added Yet</p>
            <p className="text-xs text-brand-600 mt-1">
              Add products in the admin panel to display available cashew grades and size calibers here.
            </p>
          </div>
        ) : (
          <div
            ref={gradesScrollRef}
            className="flex items-stretch gap-3 sm:gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 px-1 snap-x scroll-smooth"
          >
            {gradeCards.map((item) => (
              <button
                key={item.grade}
                onClick={() => onSelectGrade(item.grade)}
                className="flex-shrink-0 w-[148px] sm:w-[172px] md:w-[195px] lg:w-[215px] snap-start flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl bg-white border border-brand-200/80 shadow-luxury hover:shadow-luxury-lg hover:-translate-y-1.5 hover:border-brand-500 transition-all duration-300 text-center group cursor-pointer"
              >
                {/* Single Cashew Visual in luxurious prominent tile */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-b from-[#FDFBF7] to-[#F5ECE0] border border-brand-200/70 flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300 p-2">
                  <img
                    src={item.image || '/cashew_single_nut.jpg'}
                    alt={`${item.grade} cashew nut`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 object-contain ${item.scale} transition-transform duration-300 group-hover:scale-110 drop-shadow-md`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/cashew_single_nut.jpg';
                    }}
                  />
                </div>

                {/* Grade Code */}
                <div className="font-serif text-lg sm:text-2xl font-bold text-brand-950 group-hover:text-brand-700 transition-colors">
                  {item.grade}
                </div>

                {/* Subtitle / Size Label */}
                <div className="text-xs sm:text-sm text-brand-600 font-medium mt-0.5 truncate max-w-full px-1">
                  {item.label}
                </div>

                {/* Stock / Variety Count or Price */}
                {item.productCount && item.productCount > 1 ? (
                  <div className="text-[10px] sm:text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-200/80 px-2.5 py-0.5 rounded-full mt-2">
                    {item.productCount} Harvests / Styles
                  </div>
                ) : item.minPrice ? (
                  <div className="text-[11px] sm:text-xs font-semibold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full mt-2 border border-forest-200/60">
                    from {formatPrice(item.minPrice)}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {/* Location-wise Cashew Section Header */}
        {totalBanners > 0 && currentBanner && (
          <div className="mt-8 sm:mt-12">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-forest-600" />
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-bold text-brand-600">
                  Coastal Harvest & Sourcing Regions
                </span>
              </div>

            {totalBanners > 1 && (
              <span className="text-xs font-semibold text-brand-500 hidden sm:inline-block">
                {activeSlide + 1} of {totalBanners} • Swipe to browse
              </span>
            )}
          </div>

          {/* Big, Full-Width Responsive Swipeable Location Banner Card */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleBannerClick}
            className="relative rounded-3xl overflow-hidden cursor-pointer group shadow-luxury border border-brand-200/70 select-none transition-all"
          >
            <div className="relative min-h-[290px] sm:min-h-0 sm:h-60 md:h-64 lg:h-72 overflow-hidden">
              <img
                src={currentBanner.image || '/hero_cashew_bowl.jpg'}
                alt={currentBanner.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 filter brightness-[0.90]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/hero_cashew_bowl.jpg';
                }}
              />

              {/* High Contrast Scrim Gradients (optimized separately for mobile & desktop) */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/75 to-brand-950/40 sm:hidden" />
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-950/65 to-transparent" />

              {/* MOBILE VIEW: Clean vertical stack with ample breathing room */}
              <div className="sm:hidden absolute inset-0 flex flex-col justify-between p-5 z-10">
                {/* Mobile Top Row: Badges & Slide Indicator */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9.5px] uppercase tracking-[0.2em] font-bold text-cream-200 bg-brand-900/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15">
                      {currentBanner.tag}
                    </span>
                    {currentBanner.locationKey && (
                      <span className="text-[9.5px] font-semibold bg-forest-900/80 text-forest-200 px-2.5 py-0.5 rounded-full border border-forest-500/30 flex items-center gap-1">
                        <span>📍</span>
                        <span>{currentBanner.locationKey}</span>
                      </span>
                    )}
                  </div>

                  {totalBanners > 1 && (
                    <span className="text-[10px] font-bold text-cream-200/90 bg-white/15 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {activeSlide + 1}/{totalBanners}
                    </span>
                  )}
                </div>

                {/* Mobile Middle: Title & Subtitle */}
                <div className="my-auto py-2">
                  <h3 className="font-serif text-xl font-bold text-cream-50 leading-tight drop-shadow-md">
                    {currentBanner.title}
                  </h3>
                  {currentBanner.subtitle && (
                    <p className="text-xs text-cream-200/90 line-clamp-2 leading-relaxed mt-1.5 drop-shadow-sm">
                      {currentBanner.subtitle}
                    </p>
                  )}
                </div>

                {/* Mobile Bottom: Action Button & Compact Controls */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white text-brand-950 px-4 py-2 text-xs font-bold shadow-lg transition-transform active:scale-95">
                    <span>{currentBanner.linkText || 'Explore Cashews'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                  </div>

                  {totalBanners > 1 && (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 text-cream-50 flex items-center justify-center backdrop-blur-md transition-colors"
                        aria-label="Previous Banner"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 text-cream-50 flex items-center justify-center backdrop-blur-md transition-colors"
                        aria-label="Next Banner"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* DESKTOP VIEW: Spacious horizontal banner */}
              <div className="hidden sm:flex absolute inset-0 items-center justify-between px-8 md:px-12 lg:px-14 z-10">
                <div className="max-w-[70%] lg:max-w-xl pr-6">
                  {/* Origin Tag */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-cream-200/90 drop-shadow-sm">
                      {currentBanner.tag}
                    </span>
                    {currentBanner.locationKey && (
                      <span className="text-[10px] font-semibold bg-white/20 backdrop-blur-sm text-cream-100 px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
                        <span>📍</span>
                        <span>{currentBanner.locationKey}</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-2xl lg:text-3xl font-bold text-cream-50 leading-tight mb-2 drop-shadow-md">
                    {currentBanner.title}
                  </h3>

                  {/* Subtitle */}
                  {currentBanner.subtitle && (
                    <p className="text-xs sm:text-sm text-cream-200/90 line-clamp-2 leading-relaxed">
                      {currentBanner.subtitle}
                    </p>
                  )}
                </div>

                {/* Pill Action Button */}
                <div className="shrink-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/25 hover:bg-white text-cream-50 hover:text-brand-950 backdrop-blur-md px-6 py-3 text-xs sm:text-sm font-semibold transition-all shadow-md group-hover:bg-white group-hover:text-brand-950">
                    <span>{currentBanner.linkText || 'Explore Cashews'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Desktop Prev / Next Slider Arrows */}
              {totalBanners > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevSlide();
                    }}
                    className="hidden sm:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-brand-950/50 hover:bg-brand-950/85 text-white backdrop-blur-md items-center justify-center border border-white/20 transition-all shadow-md hover:scale-105"
                    aria-label="Previous Location Banner"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextSlide();
                    }}
                    className="hidden sm:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-brand-950/50 hover:bg-brand-950/85 text-white backdrop-blur-md items-center justify-center border border-white/20 transition-all shadow-md hover:scale-105"
                    aria-label="Next Location Banner"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Indicator Dots */}
                  <div className="hidden sm:flex absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 items-center gap-1.5">
                    {locationBanners.map((_, i) => (
                      <span
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlide(i);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          i === activeSlide ? 'w-6 bg-cream-50 shadow-sm' : 'w-1.5 bg-cream-50/40 hover:bg-cream-50/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      </div>
    </section>
  );
}