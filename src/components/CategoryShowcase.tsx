import { ArrowRight } from 'lucide-react';
import { useSiteContent, DEFAULT_CATEGORY_BANNERS, type CategoryBannerItem } from '@/site-content';

interface CategoryShowcaseProps {
  onSelectCategory: (categoryId: string) => void;
  onExploreAll: () => void;
  selectedCategory?: string | null;
}

export default function CategoryShowcase({
  onSelectCategory,
  onExploreAll,
  selectedCategory,
}: CategoryShowcaseProps) {
  const siteContent = useSiteContent();
  const items = (siteContent.categoryBanners && siteContent.categoryBanners.length > 0)
    ? siteContent.categoryBanners
    : DEFAULT_CATEGORY_BANNERS;

  const handleCardClick = (item: CategoryBannerItem) => {
    const targetCat = item.categoryIds && item.categoryIds.length > 0
      ? item.categoryIds.join(',')
      : item.categoryId;
    onSelectCategory(targetCat);
    setTimeout(() => {
      const el = document.getElementById('products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <section className="bg-[#FAF7F2] py-5 sm:py-7 border-b border-[#EEDBCA]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Responsive Grid based on card count */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 ${items.length <= 3 ? 'lg:grid-cols-3' : items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-3 sm:gap-4 lg:gap-5`}>
          {items.map((item, index) => {
            const targetCat = item.categoryIds && item.categoryIds.length > 0
              ? item.categoryIds.join(',')
              : item.categoryId;
            const isSelected = selectedCategory === targetCat || (item.categoryIds && item.categoryIds.includes(selectedCategory || ''));
            const isLastOnMobileOdd = index === items.length - 1 && items.length % 2 !== 0;

            return (
              <button
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`group relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 text-left p-0 cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#8C6339] bg-white ${
                  isSelected
                    ? 'border-[#8C6339] ring-2 ring-[#8C6339]/40 shadow-md'
                    : 'border-[#E7DEC8]/90 hover:border-[#D9C8B5]'
                } ${isLastOnMobileOdd ? 'col-span-2 sm:col-span-1' : ''}`}
                aria-label={`Explore ${item.title}`}
              >
                {/* Photo container */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#F5EBE1]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>

                {/* Clean, dedicated card info panel (always 100% legible) */}
                <div className="p-3 sm:p-3.5 bg-white flex flex-col justify-between flex-1 border-t border-[#F0E6D8]">
                  <div>
                    <h3 className="font-serif text-xs sm:text-sm font-bold text-[#2A1D13] leading-snug line-clamp-1 group-hover:text-[#8C6339] transition-colors">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-[10px] sm:text-[11px] text-[#7A6B5D] mt-0.5 line-clamp-1 font-normal">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#8C6339] group-hover:translate-x-0.5 transition-transform">
                    <span>Shop Collection</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
