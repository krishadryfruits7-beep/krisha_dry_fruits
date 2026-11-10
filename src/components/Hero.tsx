import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Gift, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteContent, type HeroSlide } from '@/site-content';

interface HeroProps {
  onShopNow: () => void;
  onExploreGiftBoxes?: () => void;
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string | null;
}

export default function Hero({
  onShopNow,
  onExploreGiftBoxes,
  onSelectCategory,
}: HeroProps) {
  const siteContent = useSiteContent();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  const slides: HeroSlide[] =
    Array.isArray(siteContent.heroSlides) && siteContent.heroSlides.length > 0
      ? siteContent.heroSlides
      : [
          {
            id: 'default-hero',
            badge: siteContent.hero?.badge || 'PREMIUM DRY FRUITS STORE',
            titleLine1: siteContent.hero?.titleLine1 || 'Goodness',
            titleLine2: siteContent.hero?.titleLine2 || 'in Every',
            titleHighlight: siteContent.hero?.titleHighlight || 'Bite',
            subtitle:
              siteContent.hero?.subtitle ||
              'Explore our handpicked dry fruits, nuts and wholesome delights.',
            buttonText: siteContent.hero?.buttonText || 'Shop All Dry Fruits',
            image:
              siteContent.hero?.image ||
              'https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784659/krisha_dry_fruits/products/hero_bowls.png',
          },
        ];

  // Keep index within bounds if slides list changes
  useEffect(() => {
    if (currentIdx >= slides.length) {
      setCurrentIdx(0);
    }
  }, [slides.length, currentIdx]);

  // Auto-advance carousel
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused]);

  const activeSlide = slides[currentIdx] || slides[0];

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleGiftBoxesClick = () => {
    if (onExploreGiftBoxes) {
      onExploreGiftBoxes();
    } else if (onSelectCategory) {
      onSelectCategory('gift-boxes');
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onShopNow();
    }
  };

  const badgeText = activeSlide.badge || 'PREMIUM DRY FRUITS STORE';
  const titleLine1 = activeSlide.titleLine1 || 'Goodness';
  const titleLine2 = activeSlide.titleLine2 || 'in Every';
  const titleHighlight = activeSlide.titleHighlight || 'Bite';
  const subtitle =
    activeSlide.subtitle ||
    'Explore our handpicked dry fruits, nuts and wholesome delights.';
  const buttonText = activeSlide.buttonText || 'Shop All Dry Fruits';
  const heroImage =
    activeSlide.image ||
    siteContent.hero?.image ||
    'https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784659/krisha_dry_fruits/products/hero_bowls.png';

  return (
    <section
      className="relative overflow-hidden bg-[#FAF6F0] border-b border-[#EEDBCA]/60 select-none"
      aria-label="Krisha Dry Fruits Hero Banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center min-h-[380px] sm:min-h-[420px]">
          
          {/* ── Left Column: Editorial Headline & Actions ───────────────────────── */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center text-left z-10 transition-opacity duration-300">
            {/* Overline with Horizontal Accent Line */}
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="text-xs sm:text-[13px] font-semibold uppercase tracking-[0.22em] text-[#695A4C]">
                {badgeText}
              </span>
              <span className="w-12 sm:w-16 h-px bg-[#CBBBA8]/80 inline-block" />
            </div>

            {/* Main Heading */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-bold text-[#1E150F] tracking-tight leading-[1.08] mb-4 sm:mb-5 transition-all">
              {titleLine1} <br />
              {titleLine2}{' '}
              <span className="font-serif italic font-normal text-[#8E5B28] transition-colors">
                {titleHighlight}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-[#5C534A] font-normal leading-relaxed mb-6 sm:mb-8 max-w-md">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {/* Primary Dark Pill Button */}
              <button
                type="button"
                onClick={onShopNow}
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#202919] hover:bg-[#151C10] text-white font-medium text-xs sm:text-sm lg:text-base flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Secondary Light Pill Button */}
              <button
                type="button"
                onClick={handleGiftBoxesClick}
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white/80 hover:bg-white border border-[#403328]/30 text-[#2B2117] font-medium text-xs sm:text-sm lg:text-base flex items-center gap-2 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <Gift className="w-4 h-4 text-[#8E5B28]" />
                <span>Explore Gift Boxes</span>
              </button>
            </div>
          </div>

          {/* ── Right Column: Master Photography & Slide Navigation ───────────────── */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl lg:max-w-none rounded-2xl sm:rounded-3xl overflow-hidden shadow-luxury border border-[#EEDBCA]/60 bg-[#F5EBE1] aspect-[16/10] sm:aspect-[16/9]">
              <img
                key={heroImage}
                src={heroImage}
                alt={titleLine1 || 'Krisha Dry Fruits'}
                className="w-full h-full object-cover filter contrast-[1.03] select-none transition-opacity duration-500 animate-fade-in"
                loading="eager"
              />

              {/* Soft interior vignette / border glow */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-black/5 pointer-events-none" />

              {/* Arrow navigation if multiple slides */}
              {slides.length > 1 && (
                <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous slide"
                    className="pointer-events-auto p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-md hover:scale-105 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next slide"
                    className="pointer-events-auto p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-md hover:scale-105 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}

              {/* Bottom Dot Indicators */}
              {slides.length > 1 && (
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 z-20">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`transition-all duration-300 rounded-full h-2 cursor-pointer ${
                        currentIdx === idx
                          ? 'w-7 bg-white shadow-sm'
                          : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
