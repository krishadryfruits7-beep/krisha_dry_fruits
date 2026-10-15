import { Star, ArrowRight } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/data';

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
}

export default function ProductCard({ product, onView }: ProductCardProps) {
  const allPrices = (product.types || [])
    .flatMap((t) => (t.prices || []).map((p) => p.price))
    .filter(Boolean);
  const minPrice = allPrices.length ? Math.min(...allPrices) : 0;

  return (
    <div
      onClick={() => onView(product)}
      className="card card-hover overflow-hidden cursor-pointer group flex flex-col h-full bg-white border border-brand-200/60"
    >
      {/* Product Image Box */}
      <div className="relative h-60 sm:h-64 overflow-hidden bg-cream-200/50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Subtle Dark Vignette on Bottom for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Badge Pill */}
        <div className="absolute top-3.5 left-3.5">
          <span className="inline-flex items-center rounded-full bg-brand-900/90 backdrop-blur-md px-3 py-1 text-[11px] font-semibold tracking-wide text-cream-50 shadow-sm border border-white/20">
            {product.badge}
          </span>
        </div>

        {/* Rating Pill */}
        {product.rating > 0 && (
          <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-sm border border-brand-100">
            <Star className="w-3 h-3 text-gold-500 fill-current" />
            <span className="text-xs font-bold text-brand-950">{product.rating}</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Grade, Origin & Variety Meta */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="inline-block px-2 py-0.5 rounded-md bg-brand-100 text-[11px] font-bold text-brand-900 tracking-wider">
              {product.grade}
            </span>
            {product.origin && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md font-medium border border-forest-200">
                📍 {product.origin.split(',')[0].trim()}
              </span>
            )}
            <span className="text-[11px] text-brand-600 font-medium truncate max-w-full">
              {(product.types || []).map((t) => t.type).join(', ')}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-lg font-bold text-brand-950 mb-1.5 group-hover:text-brand-700 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Tagline */}
          <p className="text-xs sm:text-sm text-brand-700/80 leading-relaxed mb-4 line-clamp-2">
            {product.tagline}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-brand-100/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-brand-500 block font-semibold">
              Starting from
            </span>
            <div className="font-serif text-xl sm:text-2xl font-bold text-brand-950 leading-tight">
              {formatPrice(minPrice)}
            </div>
          </div>

          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-cream-100 text-brand-800 group-hover:bg-brand-700 group-hover:text-cream-50 transition-all duration-300 shadow-sm">
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
