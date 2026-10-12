import { useState, useEffect, useRef, TouchEvent } from 'react';
import { ArrowRight, Leaf, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteContent, type HeroSlide } from '@/site-content';

interface HeroProps {
  onShopNow: () => void;
  onLearnMore?: () => void;
}

export default function Hero({ onShopNow }: HeroProps) {
  const content = useSiteContent();
  const { hero, heroSlides } = content;

  // Resolve slides: prefer heroSlides array, fallback to single legacy hero object
  const slides: HeroSlide[] =
    Array.isArray(heroSlides) && heroSlides.length > 0
      ? heroSlides
      : [
          {
            id: 'legacy-hero',
            badge: hero.badge,
            titleLine1: hero.titleLine1,
            titleLine2: hero.titleLine2,
            titleHighlight: hero.titleHighlight,
            subtitle: hero.subtitle,
            buttonText: hero.buttonText,
            image: hero.image,
          },
        ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Keep index within range if slides array changes
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Auto-rotate slides every 6.5s when there are multiple slides and not hovering
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [slides.length, isHovered]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance && slides.length > 1) {
      // Swiped Left -> Next
      nextSlide();
    } else if (distance < -minSwipeDistance && slides.length > 1) {
      // Swiped Right -> Prev
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <section
      className="relative overflow-hidden bg-cream-100 border-b border-brand-200/40 select-none group/hero"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Banners"
    >
      {/* Background Photography Container */}
      <div className="relative min-h-[470px] sm:min-h-[520px] lg:min-h-[560px] flex items-center">
        {/* Background Image: Positioned to prominently showcase cashews/dry fruits on right */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {slides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image || '/hero_cashew_bowl.jpg'}
                alt={slide.titleLine1 ? `${slide.titleLine1} ${slide.titleLine2 || ''}` : 'Premium Dry Fruits'}
                className="w-full h-full object-cover object-[78%_center] sm:object-[70%_center] lg:object-right filter contrast-[1.02]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/hero_cashew_bowl.jpg';
                }}
              />
            </div>
          ))}

          {/* Directional Vignette Gradient Overlay ensuring high text readability */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-cream-100/95 via-cream-100/85 sm:via-cream-100/70 to-transparent lg:w-3/5 pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-cream-100/60 via-transparent to-cream-50/20 sm:hidden pointer-events-none" />
        </div>

        {/* Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
          <div className="max-w-[290px] sm:max-w-md lg:max-w-lg">

            {/* Pill Badge */}
            {activeSlide.badge && (
              <div
                key={`badge-${currentIndex}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/75 backdrop-blur-md px-3 py-1 mb-4 sm:mb-5 border border-brand-200/70 shadow-sm animate-fade-in"
              >
                <span className="w-4 h-4 rounded-full bg-forest-600/15 flex items-center justify-center text-forest-700 shrink-0">
                  <Leaf className="w-2.5 h-2.5 text-forest-700" />
                </span>
                <span className="text-[10.5px] sm:text-xs font-semibold text-brand-900 tracking-wide">
                  {activeSlide.badge}
                </span>
              </div>
            )}

            {/* Main Headline */}
            <h1
              key={`title-${currentIndex}`}
              className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-brand-950 tracking-tight leading-[1.12] mb-3 sm:mb-4 animate-fade-in-up"
            >
              {activeSlide.titleLine1} <br />
              {activeSlide.titleLine2} <br />
              <span className="italic font-normal text-brand-800">{activeSlide.titleHighlight}</span>
            </h1>

            {/* Subtitle */}
            <p
              key={`subtitle-${currentIndex}`}
              className="text-xs sm:text-base text-brand-800/90 leading-relaxed font-normal mb-6 sm:mb-8 animate-fade-in-up max-w-[280px] sm:max-w-sm"
            >
              {activeSlide.subtitle}
            </p>

            {/* Action CTA */}
            <div className="flex items-center gap-3 animate-fade-in-up">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex items-center gap-2 rounded-full bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-cream-50 text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 sm:py-3.5 shadow-md shadow-brand-950/15 transition-all group cursor-pointer"
              >
                <span>{activeSlide.buttonText || 'Shop Now'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Previous / Next Desktop Navigation Arrows (Only shown when multiple slides exist) */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous Banner"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/70 hover:bg-white text-brand-900 items-center justify-center shadow-md backdrop-blur-sm transition-all opacity-0 group-hover/hero:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-brand-900" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next Banner"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/70 hover:bg-white text-brand-900 items-center justify-center shadow-md backdrop-blur-sm transition-all opacity-0 group-hover/hero:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-brand-900" />
            </button>
          </>
        )}

        {/* Dynamic Slider Indicator Dots (STRICTLY HIDDEN if only 1 banner exists) */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/15 backdrop-blur-sm"
            role="tablist"
            aria-label="Banner slides indicator"
          >
            {slides.map((slide, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to banner slide ${idx + 1}`}
                  role="tab"
                  aria-selected={active}
                  className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none ${
                    active
                      ? 'w-6 h-2 bg-brand-800 shadow-sm'
                      : 'w-2 h-2 bg-brand-600/50 hover:bg-brand-700/80'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
