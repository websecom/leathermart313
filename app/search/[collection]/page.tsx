import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import { defaultSort, sorting } from 'lib/constants';
import {
    getCollection,
    getCollectionProducts,
    parseMultiValueFilter,
    parsePriceFilter
} from 'lib/store';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params
}: {
  params: { collection: string };
}): Promise<Metadata> {
  const collection = await getCollection(params.collection);
  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description || collection.description || `${collection.title} products`
  };
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: { collection: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const sort = typeof searchParams?.sort === 'string' ? searchParams.sort : undefined;
  const minPrice =
    typeof searchParams?.minPrice === 'string'
      ? parsePriceFilter(searchParams.minPrice)
      : undefined;
  const maxPrice =
    typeof searchParams?.maxPrice === 'string'
      ? parsePriceFilter(searchParams.maxPrice)
      : undefined;
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  const collection = await getCollection(params.collection);
  if (!collection) return notFound();

  const products = await getCollectionProducts({
    collection: params.collection,
    sortKey,
    reverse,
    minPrice,
    maxPrice,
    productType: parseMultiValueFilter(searchParams?.productType),
    material: parseMultiValueFilter(searchParams?.material),
    color: parseMultiValueFilter(searchParams?.color),
    size: parseMultiValueFilter(searchParams?.size),
    inStock: parseMultiValueFilter(searchParams?.inStock).includes('true')
  });

  return (
    <section>
      {/* ── Collection heading ── */}
      <div className="mb-7">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c6f36b]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#4a6e2a]">
            Collection
          </span>
        </div>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.05em] text-[#17211f] sm:text-[32px]">
          {collection.title}
        </h1>
        <span
          className="mt-2 block h-[3px] w-9 rounded-full bg-gradient-to-r from-[#c6f36b] to-[#9cc94d]"
          aria-hidden="true"
        />
        {collection.description && (
          <p className="mt-3 max-w-[520px] text-[13px] leading-6 text-[#68736b]">
            {collection.description}
          </p>
        )}
        {products.length > 0 && (
          <p className="mt-2 text-[12px] text-[#68736b]">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      {/* ── Product grid ── */}
      {products.length === 0 ? (
        <div className="glass-card flex flex-col items-center rounded-2xl px-8 py-16 text-center">
          <span className="mb-4 text-4xl" aria-hidden="true">
            ◻
          </span>
          <p className="text-[14px] font-semibold text-[#17211f]">No products here yet</p>
          <p className="mt-1 text-[12px] text-[#68736b]">
            No products match these filters in this category.
          </p>
        </div>
      ) : (
        <Grid className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
