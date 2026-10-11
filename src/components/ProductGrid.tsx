import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onView: (product: Product) => void;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse border border-brand-200/50">
      <div className="h-60 bg-cream-200/80" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-cream-200 rounded w-1/4" />
        <div className="h-5 bg-cream-200 rounded w-3/4" />
        <div className="h-3 bg-cream-200 rounded w-full" />
        <div className="h-3 bg-cream-200 rounded w-2/3" />
        <div className="flex justify-between items-end pt-3 border-t border-brand-100">
          <div className="h-6 bg-cream-200 rounded w-1/3" />
          <div className="h-9 w-9 bg-cream-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({ products, onView, title, subtitle, loading }: ProductGridProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {title && (
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-brand-500 mb-2">
            Hand-Crafted Gourmet Harvest
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-950 mb-3 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-base text-brand-700/80 leading-relaxed font-normal">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {loading
          ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
          : products.length === 0
            ? (
              <div className="col-span-full card p-12 text-center border border-dashed border-brand-300 bg-cream-50/50">
                <p className="font-serif text-lg text-brand-900 mb-1">Catalog Currently Empty</p>
                <p className="text-sm text-brand-500">No cashew harvests or grades are currently available.</p>
              </div>
            )
            : products.map((p) => (
              <ProductCard key={(p as any)._id || p.id} product={p} onView={onView} />
            ))
        }
      </div>
    </section>
  );
}
