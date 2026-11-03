'use server';

import { getProducts, parseCartLines } from 'lib/store';
import type { CartLine } from 'lib/types';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const saveCart = (lines: CartLine[]) => {
  cookies().set('storeCart', JSON.stringify(lines), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  revalidatePath('/', 'layout');
};

const addVariantToCart = async (selectedVariantId: string | undefined): Promise<string | null> => {
  if (!selectedVariantId) return 'Please select a product option.';
  const products = await getProducts();
  const selectedVariant = products
    .flatMap((product) => product.variants)
    .find((variant) => variant.id === selectedVariantId);
  if (!selectedVariant?.availableForSale) return 'This product is not available.';

  const lines = parseCartLines(cookies().get('storeCart')?.value);
  const currentLine = lines.find((line) => line.variantId === selectedVariantId);
  if (currentLine && currentLine.quantity >= Math.min(99, selectedVariant.inventoryQuantity)) {
    return 'No more stock is available for this option.';
  }
  saveCart(
    currentLine
      ? lines.map((line) =>
          line.variantId === selectedVariantId ? { ...line, quantity: line.quantity + 1 } : line
        )
      : [...lines, { variantId: selectedVariantId, quantity: 1 }]
  );
  return null;
};

export async function addItem(
  _prevState: string | null,
  {
    selectedVariantId
  }: {
    selectedVariantId: string | undefined;
  }
): Promise<string | null> {
  return addVariantToCart(selectedVariantId);
}

export async function buyNow(selectedVariantId: string | undefined): Promise<never> {
  const error = await addVariantToCart(selectedVariantId);
  if (error) throw new Error(error);
  redirect('/checkout');
}

export async function removeItem(_prevState: string | null, lineId: string): Promise<string | null> {
  const lines = parseCartLines(cookies().get('storeCart')?.value);
  saveCart(lines.filter((line) => line.variantId !== lineId));
  return null;
}

export async function updateItemQuantity(
  _prevState: string | null,
  payload: {
    lineId: string;
    quantity: number;
  }
): Promise<string | null> {
  const { lineId, quantity } = payload;
  if (!Number.isInteger(quantity) || quantity > 99) return 'Quantity must be between 0 and 99.';

  const lines = parseCartLines(cookies().get('storeCart')?.value);
  if (quantity <= 0) {
    saveCart(lines.filter((line) => line.variantId !== lineId));
    return null;
  }

  if (!lines.some((line) => line.variantId === lineId)) return 'Cart item was not found.';
  const products = await getProducts();
  const variant = products.flatMap((product) => product.variants).find((item) => item.id === lineId);
  if (!variant?.availableForSale) return 'This product option is no longer available.';
  if (quantity > variant.inventoryQuantity) {
    return `Only ${variant.inventoryQuantity} are available for this option.`;
  }
  saveCart(lines.map((line) => (line.variantId === lineId ? { ...line, quantity } : line)));
  return null;
}
