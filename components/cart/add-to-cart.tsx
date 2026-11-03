'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { addItem, buyNow } from 'components/cart/actions';
import LoadingDots from 'components/loading-dots';
import type { ProductVariant } from 'lib/types';
import { useSearchParams } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';

function SubmitButton({
  availableForSale,
  selectedVariantId,
  compact
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
  compact: boolean;
}) {
  const { pending } = useFormStatus();
  const buttonClasses = `relative flex w-full items-center justify-center rounded-full bg-[#172c27] px-2 ${
    compact ? 'py-2.5 text-[10px]' : 'px-5 py-3.5 text-[12px]'
  } font-semibold tracking-wide text-white transition-colors hover:bg-[#27483d]`;
  const disabledClasses = 'cursor-not-allowed opacity-60 hover:opacity-60';

  if (!availableForSale) {
    return (
      <button aria-disabled className={clsx(buttonClasses, disabledClasses)}>
        Out Of Stock
      </button>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        aria-label="Please select an option"
        aria-disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        <div className="absolute left-0 ml-2">
          <PlusIcon className={compact ? 'h-3.5' : 'h-5'} />
        </div>
        Add to cart
      </button>
    );
  }

  return (
    <button
      onClick={(e: React.FormEvent<HTMLButtonElement>) => {
        if (pending) e.preventDefault();
      }}
      aria-label="Add to cart"
      aria-disabled={pending}
      className={clsx(buttonClasses, {
        'hover:opacity-90': true,
        disabledClasses: pending
      })}
    >
      <div className="absolute left-0 ml-2">
        {pending ? (
          <LoadingDots className="mb-3 bg-white" />
        ) : (
          <PlusIcon className={compact ? 'h-3.5' : 'h-5'} />
        )}
      </div>
      Add to cart
    </button>
  );
}

export function AddToCart({
  variants,
  availableForSale,
  compact = false,
  checkoutLabel = 'Buy now'
}: {
  variants: ProductVariant[];
  availableForSale: boolean;
  compact?: boolean;
  checkoutLabel?: string;
}) {
  const [message, formAction] = useFormState(addItem, null);
  const searchParams = useSearchParams();
  const defaultVariantId = compact
    ? variants.find((item) => item.availableForSale && item.inventoryQuantity > 0)?.id
    : variants.length === 1
    ? variants[0]?.id
    : undefined;
  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === searchParams.get(option.name.toLowerCase())
    )
  );
  const selectedVariantId = variant?.id || defaultVariantId;
  const actionWithVariant = formAction.bind(null, { selectedVariantId });
  const buyNowAction = buyNow.bind(null, selectedVariantId);

  return (
    <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-3'}>
      <form action={actionWithVariant}>
        <SubmitButton
          availableForSale={availableForSale}
          selectedVariantId={selectedVariantId}
          compact={compact}
        />
        <p aria-live="polite" className="sr-only" role="status">
          {message}
        </p>
      </form>
      {availableForSale ? (
        <form action={buyNowAction}>
          <button
            type="submit"
            disabled={!selectedVariantId}
            aria-disabled={!selectedVariantId}
            className={`w-full rounded-full border border-[#cbd5c7] bg-transparent px-2 ${
              compact ? 'py-2.5 text-[10px]' : 'px-5 py-3 text-[12px]'
            } font-semibold text-[#24332c] transition-colors enabled:hover:border-[#172c27] enabled:hover:bg-[#edf1e9] disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {!selectedVariantId && !compact ? 'Select options to checkout' : checkoutLabel}
          </button>
        </form>
      ) : null}
    </div>
  );
}
