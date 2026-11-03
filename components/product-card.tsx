import type { Product } from 'lib/types';
import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductCard({
  product,
  showActions = false
}: {
  product: Product;
  showActions?: boolean;
}) {
  const totalInventory = product.variants.reduce(
    (total, variant) => total + variant.inventoryQuantity,
    0
  );
  const inStock = totalInventory > 0;

  return (
    <article className="card-glow group relative flex flex-col bg-transparent">
      <Link href={product.handle} className="block">
        {/* Image container */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-[#dde8d6] to-[#c8d9bc] shadow-[0_4px_18px_rgba(23,44,39,0.08)]">
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#17211f]/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Stock badge */}
          <span
            className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] shadow-sm backdrop-blur-sm ${
              inStock
                ? 'bg-[#fbfcfa]/95 text-[#334239]'
                : 'bg-[#fff1ed]/95 text-[#a33e30]'
            }`}
          >
            {inStock ? `${totalInventory} in stock` : 'Out of stock'}
          </span>

          {/* Quick look pill — slides up on hover */}
          <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-full bg-[#c6f36b] px-5 py-2.5 text-[10px] font-bold text-[#17211f] opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Quick look ↗
          </span>
        </div>
      </Link>

      {/* Product info */}
      <Link href={product.handle} className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-bold tracking-tight text-[#17211f] transition-colors group-hover:text-[#3d6b24]">
            {product.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-[#7a857a]">{product.description}</p>
        </div>
        <Price
          className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5 text-[12px]"
          amount={product.priceRange.minVariantPrice.amount}
          compareAtAmount={product.priceRange.minCompareAtPrice.amount}
          currencyCode={product.priceRange.minVariantPrice.currencyCode}
        />
      </Link>

      {showActions ? (
        <div className="mt-3">
          <AddToCart
            variants={product.variants}
            availableForSale={product.availableForSale}
            compact
            checkoutLabel="Checkout"
          />
        </div>
      ) : null}
    </article>
  );
}
