'use client';

import clsx from 'clsx';
import type { ProductOption, ProductVariant } from 'lib/types';
import { createUrl } from 'lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean; // ie. { color: 'Red', size: 'Large', ... }
};

export function VariantSelector({
  options,
  variants
}: {
  options: ProductOption[];
  variants: ProductVariant[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasNoOptionsOrJustOneOption =
    !options.length || (options.length === 1 && options[0]?.values.length === 1);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    // Adds key / value pairs for each variant (ie. "color": "Black" and "size": 'M").
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({ ...accumulator, [option.name.toLowerCase()]: option.value }),
      {}
    )
  }));
  const selectedVariant = variants.find((variant) =>
    variant.selectedOptions.every(
      (option) => searchParams.get(option.name.toLowerCase()) === option.value
    )
  );

  return (
    <div className="mb-7 space-y-6">
      {options.map((option) => {
        const optionNameLower = option.name.toLowerCase();
        const selectedValue = searchParams.get(optionNameLower);
        return (
    <dl key={option.id}>
      <dt className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#68736b]">
        {option.name}
        {selectedValue ? (
          <span className="normal-case tracking-normal text-[#17211f]">{selectedValue}</span>
        ) : (
          <span className="normal-case font-normal tracking-normal text-[#9a9f98]">Choose one</span>
        )}
      </dt>
      <dd className="flex flex-wrap gap-2.5">
        {option.values.map((value) => {
          const optionNameLowerCase = option.name.toLowerCase();

          // Base option params on current params so we can preserve any other param state in the url.
          const optionSearchParams = new URLSearchParams(searchParams.toString());

          // Update the option params using the current option to reflect how the url *would* change,
          // if the option was clicked.
          optionSearchParams.set(optionNameLowerCase, value);
          const optionUrl = createUrl(pathname, optionSearchParams);

          // In order to determine if an option is available for sale, we need to:
          //
          // 1. Filter out all other param state
          // 2. Filter out invalid options
          // 3. Check if the option combination is available for sale
          //
          // This is the "magic" that will cross check possible variant combinations and preemptively
          // disable combinations that are not available. For example, if the color gray is only available in size medium,
          // then all other sizes should be disabled.
          const filtered = Array.from(optionSearchParams.entries()).filter(([key, value]) =>
            options.find(
              (option) => option.name.toLowerCase() === key && option.values.includes(value)
            )
          );
          const isAvailableForSale = combinations.find((combination) =>
            filtered.every(
              ([key, value]) => combination[key] === value && combination.availableForSale
            )
          );

          // The option is active if it's in the url params.
          const isActive = selectedValue === value;
          const isColor = optionNameLowerCase === 'color';

          return (
            <button
              key={value}
              type="button"
              aria-disabled={!isAvailableForSale}
              aria-pressed={isActive}
              disabled={!isAvailableForSale}
              onClick={() => {
                router.replace(optionUrl, { scroll: false });
              }}
              title={`${option.name} ${value}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
              className={clsx(
                'flex items-center justify-center border transition-all duration-200',
                isColor
                  ? 'h-11 gap-2 rounded-full bg-[#fbfcfa] px-3.5 text-[11px] font-medium'
                  : 'min-h-10 min-w-12 rounded-xl bg-[#fbfcfa] px-3 text-[12px] font-semibold',
                {
                  'border-[#172c27] bg-[#edf2e9] text-[#17211f] ring-1 ring-[#172c27]': isActive,
                  'border-[#dce3da] text-[#59645b] hover:border-[#8b9d8e] hover:bg-white':
                    !isActive && isAvailableForSale,
                  'relative cursor-not-allowed overflow-hidden border-[#e3e5e1] bg-[#f1f2ef] text-[#a6aaa4] before:absolute before:inset-x-1 before:top-1/2 before:h-px before:-rotate-45 before:bg-[#a6aaa4]':
                    !isAvailableForSale
                }
              )}
            >
              {isColor ? (
                <span
                  aria-hidden="true"
                  className="h-5 w-5 rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: colorSwatches[value] || value.toLowerCase() }}
                />
              ) : null}
              {value}
            </button>
          );
        })}
      </dd>
    </dl>
  );
      })}
      <p
  aria-live="polite"
  className={clsx(
    'flex items-center gap-2 text-[11px]',
    selectedVariant?.availableForSale ? 'text-[#58723e]' : 'text-[#8a928b]'
  )}
      >
  <span
    aria-hidden="true"
    className={clsx(
      'h-2 w-2 rounded-full',
      selectedVariant?.availableForSale ? 'bg-[#7ba747]' : 'bg-[#b5b9b2]'
    )}
  />
  {selectedVariant
    ? selectedVariant.availableForSale
      ? `${selectedVariant.inventoryQuantity} available in this option`
      : 'Currently out of stock'
    : 'Choose options to see availability'}
  <span className="text-[#9a9f98]">(demo inventory)</span>
      </p>
    </div>
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
