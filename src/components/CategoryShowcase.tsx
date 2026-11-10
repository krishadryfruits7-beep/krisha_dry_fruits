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
                className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 text-left p-0 cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#8C6339] ${
                  isSelected
                    ? 'border-[#8C6339] ring-2 ring-[#8C6339]/40 shadow-md'
                    : 'border-[#E7DEC8]/90 hover:border-[#D9C8B5] bg-[#F5EBE1]'
                } ${isLastOnMobileOdd ? 'col-span-2 sm:col-span-1' : ''}`}
                aria-label={`Explore ${item.title}`}
              >
                {/* Mockup HD card visual matching reference design 100% */}
                <div className="relative w-full aspect-[2.35/1] overflow-hidden bg-[#F5EBE1]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  {/* Subtle hover sheen */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
