import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import { defaultSort, sorting } from 'lib/constants';
import { getProducts, parseMultiValueFilter, parsePriceFilter } from 'lib/store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Search',
  description: 'Search for products in the store.'
};

export default async function SearchPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const sort = typeof searchParams?.sort === 'string' ? searchParams.sort : undefined;
  const searchValue = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const minPrice =
    typeof searchParams?.minPrice === 'string'
      ? parsePriceFilter(searchParams.minPrice)
      : undefined;
  const maxPrice =
    typeof searchParams?.maxPrice === 'string'
      ? parsePriceFilter(searchParams.maxPrice)
      : undefined;
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  const products = await getProducts({
    sortKey,
    reverse,
    query: searchValue,
    minPrice,
    maxPrice,
    productType: parseMultiValueFilter(searchParams?.productType),
    material: parseMultiValueFilter(searchParams?.material),
    color: parseMultiValueFilter(searchParams?.color),
    size: parseMultiValueFilter(searchParams?.size),
    inStock: parseMultiValueFilter(searchParams?.inStock).includes('true')
  });
  const resultsText = products.length > 1 ? 'results' : 'result';

  return (
    <>
      {/* ── Page heading ── */}
      <div className="mb-7">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c6f36b]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#4a6e2a]">
            {searchValue ? 'Search results' : 'All products'}
          </span>
        </div>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.05em] text-[#17211f] sm:text-[32px]">
          {searchValue ? (
            <>
              Results for{' '}
              <span className="text-[#3d6b24]">&ldquo;{searchValue}&rdquo;</span>
            </>
          ) : (
            'Shop all'
          )}
        </h1>
        <span
          className="mt-2 block h-[3px] w-9 rounded-full bg-gradient-to-r from-[#c6f36b] to-[#9cc94d]"
          aria-hidden="true"
        />
        {products.length > 0 && (
          <p className="mt-3 text-[12px] text-[#68736b]">
            {products.length} {resultsText}
          </p>
        )}
      </div>

      {/* ── Results ── */}
      {products.length > 0 ? (
        <Grid className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : (
        <div className="glass-card flex flex-col items-center rounded-2xl px-8 py-16 text-center">
          <span className="mb-4 text-4xl" aria-hidden="true">
            ⌕
          </span>
          <p className="text-[14px] font-semibold text-[#17211f]">No products found</p>
          <p className="mt-1 text-[12px] text-[#68736b]">
            {searchValue
              ? `No products match "${searchValue}". Try a different search.`
              : 'No products match these filters. Try adjusting or clearing your filters.'}
          </p>
        </div>
      )}
    </>
  );
}
