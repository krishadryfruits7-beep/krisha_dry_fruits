import { Check, ArrowRight } from 'lucide-react';
import { GRADES, formatPrice } from '@/data';
import type { Product } from '@/types';

interface GradesGuideProps {
  onShop: () => void;
  onViewProduct: (id: string) => void;
  products?: Product[];
}

function SkeletonRow() {
  return (
    <div className="card p-6 flex flex-col md:flex-row gap-6 items-center animate-pulse">
      <div className="flex items-center gap-4 md:w-48 shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-cream-200" />
        <div className="space-y-2">
          <div className="h-4 w-12 bg-cream-200 rounded" />
          <div className="h-3 w-20 bg-cream-200 rounded" />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-5 w-40 bg-cream-200 rounded" />
        <div className="h-3 w-full bg-cream-200 rounded" />
        <div className="h-3 w-3/4 bg-cream-200 rounded" />
      </div>
      <div className="shrink-0 space-y-2 text-right">
        <div className="h-3 w-10 bg-cream-200 rounded ml-auto" />
        <div className="h-7 w-20 bg-cream-200 rounded ml-auto" />
      </div>
    </div>
  );
}

export default function GradesGuide({ onShop, onViewProduct, products }: GradesGuideProps) {
  const loading = !products;
  const empty = products?.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-brand-950 mb-3">Understanding Cashew Grades</h1>
        <p className="text-brand-600 max-w-xl mx-auto">
          The "W" number tells you how many cashews make up one pound — a smaller number means larger, more premium nuts.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
        ) : empty ? (
          <div className="card p-12 text-center border border-dashed border-brand-300 bg-cream-50/50">
            <p className="font-serif text-xl font-bold text-brand-950 mb-2">Catalog Currently Clean</p>
            <p className="text-sm text-brand-600 mb-6 max-w-md mx-auto">
              There are no cashew grades or products listed in the catalog yet. Once products are created in the admin panel, they will appear here with full caliber details.
            </p>
            <button onClick={onShop} className="btn-primary">
              Explore Storefront
            </button>
          </div>
        ) : (
          products.map((product, i) => {
            const gradeInfo = GRADES.find((g) => g.grade.toUpperCase() === product.grade.toUpperCase());
            const gradeDesc = product.gradeDescription || gradeInfo?.description || product.tagline || 'Hand-sorted whole kernels';
            const allPrices = (product.types || []).flatMap((t) => (t.prices || []).map((p) => p.price)).filter(Boolean);
            const minPrice = allPrices.length ? Math.min(...allPrices) : null;
            return (
              <div
                key={(product as any)._id || product.id || product.grade}
                className="card p-6 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-center"
              >
                <div className="flex items-center gap-4 md:w-48 shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center font-serif text-lg font-bold text-brand-700">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-xl font-bold text-brand-900">{product.grade}</span>
                      {product.origin && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cream-100 text-brand-700 border border-brand-200">
                          📍 {product.origin}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-brand-500 line-clamp-1">{gradeDesc}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-semibold text-brand-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-brand-600 leading-relaxed mb-2">{product.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {(product.types || []).slice(0, 4).map((t) => (
                      <span key={t.type} className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 text-xs text-brand-600">
                        <Check className="w-3 h-3 text-forest-600" />
                        {t.type}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-center md:text-right shrink-0">
                  {minPrice && (
                    <>
                      <div className="text-xs text-brand-500">From</div>
                      <div className="font-serif text-2xl font-bold text-brand-900 mb-2">{formatPrice(minPrice)}</div>
                    </>
                  )}
                  <button
                    onClick={() => onViewProduct((product as any)._id || product.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    View grade
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!empty && (
        <div className="text-center mt-10">
          <button onClick={onShop} className="btn-primary">
            Shop All Cashews
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
