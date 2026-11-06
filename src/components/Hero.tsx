import { ArrowRight, Gift } from 'lucide-react';
import { useSiteContent } from '@/site-content';

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
  const hero = siteContent.hero || {};

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

  const badgeText = hero.badge || 'PREMIUM DRY FRUITS STORE';
  const titleLine1 = hero.titleLine1 || 'Goodness';
  const titleLine2 = hero.titleLine2 || 'in Every';
  const titleHighlight = hero.titleHighlight || 'Bite';
  const subtitle = hero.subtitle || 'Explore our handpicked dry fruits, nuts and wholesome delights.';
  const buttonText = hero.buttonText || 'Shop All Dry Fruits';
  const heroImage = hero.image || 'https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784659/krisha_dry_fruits/products/hero_bowls.png';

  return (
    <section
      className="relative overflow-hidden bg-[#FAF6F0] border-b border-[#EEDBCA]/60 select-none"
      aria-label="Krisha Dry Fruits Hero Banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
          
          {/* ── Left Column: Editorial Headline & Actions ───────────────────────── */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center text-left z-10">
            {/* Overline with Horizontal Accent Line */}
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="text-xs sm:text-[13px] font-semibold uppercase tracking-[0.22em] text-[#695A4C]">
                {badgeText}
              </span>
              <span className="w-12 sm:w-16 h-px bg-[#CBBBA8]/80 inline-block" />
            </div>

            {/* Main Heading */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[58px] xl:text-[64px] font-bold text-[#1E150F] tracking-tight leading-[1.08] mb-4 sm:mb-5">
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
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white/70 hover:bg-white border border-[#403328]/30 text-[#2B2117] font-medium text-xs sm:text-sm lg:text-base flex items-center gap-2 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <Gift className="w-4 h-4 text-[#8E5B28]" />
                <span>Explore Gift Boxes</span>
              </button>
            </div>
          </div>

          {/* ── Right Column: Master Photography ───────────────── */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl lg:max-w-none rounded-2xl sm:rounded-3xl overflow-hidden shadow-luxury border border-[#EEDBCA]/60 bg-[#F5EBE1]">
              <img
                src={heroImage}
                alt="Krisha Dry Fruits - Handpicked Premium Harvests"
                className="w-full h-auto object-cover filter contrast-[1.03] select-none"
                loading="eager"
              />

              {/* Soft interior vignette / border glow */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-black/5 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
