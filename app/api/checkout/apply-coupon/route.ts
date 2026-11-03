import { validateCoupon, getShippingSettings, computeShipping } from 'lib/coupons';
import { getCart, parseCartLines } from 'lib/store';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code } = (await request.json()) as { code?: string };

    const cartCookie = cookies().get('storeCart')?.value;
    const cartLines = parseCartLines(cartCookie);
    if (cartLines.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    const cart = await getCart(cartLines);
    const subtotal = Number(cart.cost.totalAmount.amount);

    const [validation, shipping] = await Promise.all([
      validateCoupon(code ?? '', subtotal),
      getShippingSettings().then((s) => computeShipping(subtotal, s))
    ]);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const discountAmount = validation.discountAmount;
    const total = Math.max(0, subtotal - discountAmount + shipping);

    return NextResponse.json({
      valid: true,
      code: code?.trim().toUpperCase(),
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      shippingAmount: shipping.toFixed(2),
      total: total.toFixed(2),
      message: validation.message
    });
  } catch (error) {
    console.error('[apply-coupon]', error);
    return NextResponse.json({ error: 'Could not validate coupon.' }, { status: 500 });
  }
}
