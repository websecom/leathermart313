import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
import Prose from 'components/prose';
import type { Product } from 'lib/types';
import { VariantSelector } from './variant-selector';

export function ProductDescription({ product }: { product: Product }) {
  return (
    <>
      <div className="mb-6 flex flex-col border-b border-[#e1e7de] pb-6">
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#58723e]">
          Considered everyday goods
        </p>
        <h1 className="mb-3 text-[35px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#17211f] sm:text-[42px]">
          {product.title}
        </h1>
        <div className="text-[15px]">
          <Price
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
            amount={product.priceRange.maxVariantPrice.amount}
            compareAtAmount={product.priceRange.maxCompareAtPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
          />
        </div>
      </div>
      <VariantSelector options={product.options} variants={product.variants} />

      <div className="mb-6 rounded-xl border border-[#e3e9e1] bg-[#fbfcfa]/80 p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#68736b]">
          Product details
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
          <div>
            <dt className="text-[#8a928b]">Type</dt>
            <dd className="mt-0.5 font-medium text-[#27362e]">{product.productType}</dd>
          </div>
          <div>
            <dt className="text-[#8a928b]">Material</dt>
            <dd className="mt-0.5 font-medium text-[#27362e]">{product.material}</dd>
          </div>
          <div>
            <dt className="text-[#8a928b]">Available colors</dt>
            <dd className="mt-0.5 font-medium text-[#27362e]">{product.colors.join(', ')}</dd>
          </div>
          <div>
            <dt className="text-[#8a928b]">Available sizes</dt>
            <dd className="mt-0.5 font-medium text-[#27362e]">{product.sizes.join(', ')}</dd>
          </div>
        </dl>
      </div>

      {product.descriptionHtml ? (
        <Prose
          className="mb-7 max-w-[390px] text-[13px] leading-6 text-[#68736b] prose-p:my-0"
          html={product.descriptionHtml}
        />
      ) : null}

      <div className="mt-8 max-w-[390px]">
        <AddToCart variants={product.variants} availableForSale={product.availableForSale} />
        <p className="mt-3 text-center text-[10px] text-[#8d8981]">
          Complimentary shipping on orders over $100
        </p>
      </div>
    </>
  );
}
