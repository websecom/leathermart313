import Footer from 'components/layout/footer';
import Collections from 'components/layout/search/collections';
import FilterList from 'components/layout/search/filter';
import ProductFilters from 'components/layout/search/product-filters';
import { sorting } from 'lib/constants';
import { getProductFilterOptions } from 'lib/store';
import { Suspense } from 'react';

export default async function SearchLayout({ children }: { children: React.ReactNode }) {
  const { productTypes, materials, colors, sizes } = await getProductFilterOptions();

  return (
    <Suspense>
      <div className="mx-auto max-w-[1440px] px-3 pb-20 pt-6 sm:px-5 lg:px-8">
        {/* Three-column layout: sidebar | products | sort */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

          {/* ── Left sidebar: categories + filters ── */}
          <aside className="w-full flex-none lg:w-[200px]">
            <div className="sticky top-24 space-y-1">
              <Collections />
              <ProductFilters
                productTypes={productTypes}
                materials={materials}
                colors={colors}
                sizes={sizes}
              />
            </div>
          </aside>

          {/* ── Main product grid ── */}
          <div className="min-h-[50vh] min-w-0 flex-1">{children}</div>

          {/* ── Right sidebar: sort ── */}
          <div className="w-full flex-none lg:w-[140px]">
            <div className="sticky top-24">
              {/* Sort heading */}
              <p className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#4a6e2a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c6f36b]" />
                Sort by
              </p>
              <FilterList list={sorting} title="" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Suspense>
  );
}
