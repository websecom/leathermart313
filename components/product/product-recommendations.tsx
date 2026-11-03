import ProductCard from 'components/product-card';
import Price from 'components/price';
import type { Product } from 'lib/types';
import { getProducts } from 'lib/store';
import Image from 'next/image';
import Link from 'next/link';

function RecommendationSection({
  title,
  eyebrow,
  items
}: {
  title: string;
  eyebrow?: string;
  items: Product[];
}) {
  if (!items.length) return null;

  return (
    <section className="mt-14 sm:mt-16" aria-label={title}>
      <div className="mb-5 border-b border-[#e3e9e1] pb-4">
        {eyebrow ? (
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.05em] text-[#17211f] sm:text-[28px]">
          {title}
        </h2>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id}>
            <ProductCard product={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ProductRecommendations({ product }: { product: Product }) {
  const products = await getProducts();
  const others = products.filter((item) => item.id !== product.id);
  const frequentlyBought = others
    .filter((item) => {
      const itemCategories = item.collectionHandles.filter(
        (handle) => handle !== 'featured' && handle !== 'new-arrivals'
      );
      const productCategories = product.collectionHandles.filter(
        (handle) => handle !== 'featured' && handle !== 'new-arrivals'
      );
      return (
        item.collectionHandles.includes('featured') &&
        !itemCategories.some((handle) => productCategories.includes(handle))
      );
    })
    .slice(0, 2);
  const bundle = [product, ...frequentlyBought];
  const bundleIds = new Set(bundle.map((item) => item.id));

  const customersAlsoLiked = others
    .filter(
      (item) =>
        !bundleIds.has(item.id) &&
        item.collectionHandles.some((handle) => product.collectionHandles.includes(handle))
    )
    .slice(0, 4);
  const alsoLikedIds = new Set(bundle.concat(customersAlsoLiked).map((item) => item.id));

  const similarProducts = others
    .filter(
      (item) =>
        !alsoLikedIds.has(item.id) &&
        (item.productType === product.productType ||
          item.material === product.material ||
          item.collectionHandles.some((handle) => product.collectionHandles.includes(handle)))
    )
    .slice(0, 4);

  const bundleTotal = bundle.reduce(
    (total, item) => total + Number(item.priceRange.minVariantPrice.amount),
    0
  );

  return (
    <>
      {frequentlyBought.length ? (
        <section
          className="mt-14 rounded-2xl border border-[#e3e9e1] bg-[#fbfcfa] p-4 sm:mt-16 sm:p-6"
          aria-labelledby="frequently-bought-title"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#e3e9e1] pb-4">
            <div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
                Curated sample picks
              </p>
              <h2
                id="frequently-bought-title"
                className="text-[24px] font-semibold leading-tight tracking-[-0.05em] text-[#17211f] sm:text-[28px]"
              >
                Frequently bought together
              </h2>
            </div>
            <p className="text-[11px] text-[#68736b]">
              Bundle total{' '}
              <span className="ml-1 font-semibold text-[#17211f]">${bundleTotal.toFixed(2)}</span>
            </p>
          </div>
          <ul className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            {bundle.map((item, index) => (
              <li key={item.id} className="flex min-w-0 flex-1 items-center gap-3">
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className="hidden h-8 w-8 flex-none items-center justify-center rounded-full bg-[#edf2e9] text-lg font-medium text-[#58723e] sm:flex"
                  >
                    +
                  </span>
                ) : null}
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#e8ece5] bg-white p-2.5">
                  <div className="relative h-[72px] w-[60px] flex-none overflow-hidden rounded-lg bg-[#e9ece7]">
                    <Image
                      src={item.featuredImage.url}
                      alt=""
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={item.handle}
                      className="line-clamp-2 text-[11px] font-semibold text-[#17211f] hover:underline"
                    >
                      {item.title}
                    </Link>
                    <Price
                      className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]"
                      amount={item.priceRange.minVariantPrice.amount}
                      compareAtAmount={item.priceRange.minCompareAtPrice.amount}
                      currencyCode={item.priceRange.minVariantPrice.currencyCode}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RecommendationSection
        title="Customers who purchased this also liked"
        eyebrow="Curated picks · demo store"
        items={customersAlsoLiked}
      />
      <RecommendationSection
        title="Similar products"
        eyebrow="More to explore"
        items={similarProducts}
      />
    </>
  );
}
