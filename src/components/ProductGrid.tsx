import { ArrowRight } from 'lucide-react';
import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onView: (product: Product) => void;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  onViewAll?: () => void;
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse border border-[#EADBCA]/60 bg-white rounded-2xl sm:rounded-3xl">
      <div className="h-56 bg-[#F5EBE1]" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-[#F0E6D8] rounded w-1/4" />
        <div className="h-5 bg-[#F0E6D8] rounded w-3/4" />
        <div className="h-3 bg-[#F0E6D8] rounded w-full" />
        <div className="h-3 bg-[#F0E6D8] rounded w-2/3" />
        <div className="flex justify-between items-end pt-3 border-t border-[#EADBCA]/50">
          <div className="h-6 bg-[#F0E6D8] rounded w-1/3" />
          <div className="h-9 w-9 bg-[#F0E6D8] rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({
  products,
  onView,
  title = 'Best Sellers',
  subtitle,
  loading,
  onViewAll,
}: ProductGridProps) {
  return (
    <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* ── Section Header (Mockup Style) ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
        {/* Centered / Left-aligned Title with Leaf Decoration */}
        <div className="text-center sm:text-left mx-auto sm:mx-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            <span className="w-8 h-px bg-[#CBBBA8]/80 inline-block sm:hidden" />
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#807062]">
              OUR FINEST SELECTION
            </span>
            <span className="w-8 h-px bg-[#CBBBA8]/80 inline-block" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E150F] tracking-tight">
            {title}
          </h2>

          <div className="flex justify-center sm:justify-start mt-1.5">
            <span className="text-base" role="img" aria-label="natural harvest leaf">
              🍃
            </span>
          </div>

          {subtitle && (
            <p className="text-xs sm:text-sm text-[#706456] leading-relaxed mt-2 max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right-aligned 'View All Products ->' Link */}
        {onViewAll && (
          <div className="text-center sm:text-right shrink-0">
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm lg:text-base font-semibold text-[#1E150F] hover:text-[#8C6339] transition-colors cursor-pointer group"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>

      {/* ── 4-Column Product Grid (Mockup Style) ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
        ) : products.length === 0 ? (
          <div className="col-span-full card p-12 text-center border border-dashed border-[#D9C8B5] bg-[#FAF7F2] rounded-3xl">
            <p className="font-serif text-lg text-[#1E150F] mb-1">Catalog Currently Empty</p>
            <p className="text-sm text-[#706456]">No dry fruits or harvests currently available for this selection.</p>
          </div>
        ) : (
          products.map((p) => (
            <ProductCard key={(p as any)._id || p.id} product={p} onView={onView} />
          ))
        )}
      </div>
    </section>
  );
}
