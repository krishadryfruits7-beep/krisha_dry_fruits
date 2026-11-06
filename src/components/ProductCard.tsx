import { Star, ArrowRight, Sparkles } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/data';

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
}

export default function ProductCard({ product, onView }: ProductCardProps) {
  const allPrices = (product.types || [])
    .flatMap((t) => (t.prices || []).map((p) => p.price))
    .filter((pr): pr is number => typeof pr === 'number' && pr > 0);
  const minPrice = allPrices.length ? Math.min(...allPrices) : 0;

  const firstBenefit = product.healthBenefits?.[0];

  // Distinguish badge color palette matching the reference mockup
  const getBadgeStyle = (badge?: string) => {
    const b = (badge || '').toLowerCase();
    if (b.includes('bestseller') || b.includes('best value') || b.includes('top pick')) {
      return 'bg-[#9E6728] text-white'; // warm amber caramel
    }
    return 'bg-[#334E27] text-white'; // deep forest olive
  };

  return (
    <div
      onClick={() => onView(product)}
      className="card card-hover overflow-hidden cursor-pointer group flex flex-col h-full bg-[#FAF6F0] hover:bg-white rounded-2xl sm:rounded-3xl border border-[#EADBCA]/70 shadow-luxury hover:shadow-luxury-lg transition-all duration-300"
    >
      {/* Product Image Box */}
      <div className="relative h-52 sm:h-60 overflow-hidden bg-[#F5EBE1]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Badge Pill on top-left (Mockup Style: Bestseller, Premium Quality, Best Value, Fresh Stock) */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide shadow-xs ${getBadgeStyle(
                product.badge
              )}`}
            >
              {product.badge}
            </span>
          </div>
        )}

        {/* Rating Pill on top-right */}
        {product.rating > 0 && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-2xs border border-[#E7DDCF] z-10">
            <Star className="w-3 h-3 text-amber-500 fill-current" />
            <span className="text-xs font-bold text-[#1E150F]">{product.rating}</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Caliber / Grade & Origin Meta */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="inline-block px-2 py-0.5 rounded-md bg-[#F0E6D8] text-[10.5px] font-bold text-[#5A432E] tracking-wider">
              {product.grade}
            </span>
            {product.origin && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-[#334E27] bg-[#EAF0E6] px-2 py-0.5 rounded-md font-medium border border-[#D5E2D0]">
                📍 {product.origin.split(',')[0].trim()}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#1E150F] mb-1 group-hover:text-[#8C6339] transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Tagline */}
          <p className="text-xs text-[#706456] leading-relaxed mb-2.5 line-clamp-2">
            {product.tagline}
          </p>

          {/* First health benefit highlight if present */}
          {firstBenefit && (
            <div className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#5A432E] bg-[#F3ECE4]/80 px-2 py-0.5 rounded-md mb-2 line-clamp-1">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{firstBenefit}</span>
            </div>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-[#EADBCA]/60 flex items-center justify-between mt-1">
          <div>
            {minPrice > 0 ? (
              <>
                <span className="text-[10px] uppercase tracking-wider text-[#8C7A6A] block font-bold">
                  Starting from
                </span>
                <div className="font-serif text-lg sm:text-xl font-bold text-[#1E150F] leading-tight">
                  {formatPrice(minPrice)}{' '}
                  <span className="text-[10.5px] font-normal text-[#706456]">/ 250g</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase tracking-wider text-red-600 block font-semibold">
                  Status
                </span>
                <div className="font-serif text-sm font-bold text-gray-500 leading-tight">
                  Out of Stock
                </div>
              </>
            )}
          </div>

          <div className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#202919] text-white group-hover:bg-[#151C10] group-hover:scale-105 transition-all duration-300 shadow-2xs">
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
