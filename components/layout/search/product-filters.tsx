'use client';

import { createUrl } from 'lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';

export default function ProductFilters({
  productTypes,
  materials,
  colors,
  sizes
}: {
  productTypes: string[];
  materials: string[];
  colors: string[];
  sizes: string[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preservedParams = new URLSearchParams();
  const query = searchParams.get('q');
  const sort = searchParams.get('sort');
  const selectedTypes = searchParams.getAll('productType');
  const selectedMaterials = searchParams.getAll('material');
  const selectedColors = searchParams.getAll('color');
  const selectedSizes = searchParams.getAll('size');
  const inStock = searchParams.get('inStock') === 'true';
  if (query) preservedParams.set('q', query);
  if (sort) preservedParams.set('sort', sort);

  return (
    <section className="mt-7 border-t border-[#e3e9e1] pt-5" aria-labelledby="product-filters-title">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="product-filters-title" className="text-[11px] font-semibold uppercase tracking-[0.14em]">
          Filters
        </h2>
        <a
          href={createUrl(pathname, preservedParams)}
          className="text-[10px] text-[#657168] underline underline-offset-2 hover:text-[#17211f]"
        >
          Clear
        </a>
      </div>

      <form action={pathname} method="get" className="space-y-4">
        {query ? <input type="hidden" name="q" value={query} /> : null}
        {sort ? <input type="hidden" name="sort" value={sort} /> : null}

        <fieldset>
          <legend className="mb-2 text-[11px] font-medium">Price (USD)</legend>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="min-price">
              Minimum price
            </label>
            <input
              id="min-price"
              name="minPrice"
              type="number"
              min="0"
              step="1"
              placeholder="Min"
              defaultValue={searchParams.get('minPrice') || ''}
              className="w-full min-w-0 rounded-md border border-[#dce3da] bg-[#fbfcfa] px-2 py-2 text-[11px] outline-none focus:border-[#9cc94d]"
            />
            <span className="text-[#8d968e]">–</span>
            <label className="sr-only" htmlFor="max-price">
              Maximum price
            </label>
            <input
              id="max-price"
              name="maxPrice"
              type="number"
              min="0"
              step="1"
              placeholder="Max"
              defaultValue={searchParams.get('maxPrice') || ''}
              className="w-full min-w-0 rounded-md border border-[#dce3da] bg-[#fbfcfa] px-2 py-2 text-[11px] outline-none focus:border-[#9cc94d]"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[11px] font-medium">Product type</legend>
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {productTypes.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[11px] text-[#59645b] transition-colors hover:bg-[#e9eee6] hover:text-[#17211f]"
              >
                <input
                  type="checkbox"
                  name="productType"
                  value={type}
                  defaultChecked={selectedTypes.includes(type)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#cbd5c7] accent-[#58723e] focus-visible:ring-2 focus-visible:ring-[#9cc94d]"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[11px] font-medium">Material</legend>
          <div className="space-y-1">
            {materials.map((material) => (
              <label
                key={material}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[11px] text-[#59645b] transition-colors hover:bg-[#e9eee6] hover:text-[#17211f]"
              >
                <input
                  type="checkbox"
                  name="material"
                  value={material}
                  defaultChecked={selectedMaterials.includes(material)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#cbd5c7] accent-[#58723e] focus-visible:ring-2 focus-visible:ring-[#9cc94d]"
                />
                <span>{material}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[11px] font-medium">Color</legend>
          <div className="space-y-1">
            {colors.map((color) => (
              <label
                key={color}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[11px] text-[#59645b] transition-colors hover:bg-[#e9eee6] hover:text-[#17211f]"
              >
                <input
                  type="checkbox"
                  name="color"
                  value={color}
                  defaultChecked={selectedColors.includes(color)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#cbd5c7] accent-[#58723e] focus-visible:ring-2 focus-visible:ring-[#9cc94d]"
                />
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ backgroundColor: colorSwatches[color] || color.toLowerCase() }}
                />
                <span>{color}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[11px] font-medium">Size</legend>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((size) => (
              <label key={size} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="size"
                  value={size}
                  defaultChecked={selectedSizes.includes(size)}
                  className="peer sr-only"
                />
                <span className="inline-flex min-h-8 min-w-9 items-center justify-center rounded-md border border-[#dce3da] bg-[#fbfcfa] px-2 text-[10px] text-[#59645b] transition-colors hover:border-[#9ba99d] peer-checked:border-[#172c27] peer-checked:bg-[#172c27] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#9cc94d]">
                  {size}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[11px] text-[#59645b] transition-colors hover:bg-[#e9eee6] hover:text-[#17211f]">
          <input
            type="checkbox"
            name="inStock"
            value="true"
            defaultChecked={inStock}
            className="h-3.5 w-3.5 cursor-pointer rounded border-[#cbd5c7] accent-[#58723e] focus-visible:ring-2 focus-visible:ring-[#9cc94d]"
          />
          In stock only
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-[#172c27] px-3 py-2.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#27483d]"
        >
          Apply filters
        </button>
      </form>
    </section>
  );
}

const colorSwatches: Record<string, string> = {
  Black: '#222222',
  Blue: '#6683a2',
  Brown: '#79563d',
  Charcoal: '#55585a',
  Cream: '#e8dfc9',
  Forest: '#344b3c',
  Natural: '#d8c9ac',
  Navy: '#273a57',
  Olive: '#72754a',
  Rust: '#a75e3e',
  Sage: '#a8b49b',
  Sand: '#c8b79b',
  Tan: '#bd9168',
  Tortoise: '#78553e',
  White: '#ffffff'
};
