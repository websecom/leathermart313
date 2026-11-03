/**
 * POST /api/cashfree/create-order
 *
 * Creates a Cashfree payment order server-side.
 * Collects customer info + delivery address and persists to Supabase.
 */

import { auth } from '@clerk/nextjs/server';
import { createCashfreeOrder } from 'lib/cashfree';
import { computeShipping, getShippingSettings, incrementCouponUsage, validateCoupon } from 'lib/coupons';
import { isOrdersDatabaseConfigured, saveOrder, type OrderItem } from 'lib/orders-storage';
import { getCart, parseCartLines } from 'lib/store';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      altPhone,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      deliveryNote,
      couponCode
    } = body as {
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      altPhone?: string;
      deliveryAddress?: string;
      deliveryCity?: string;
      deliveryState?: string;
      deliveryPincode?: string;
      deliveryNote?: string;
      couponCode?: string;
    };

    // ── Validate required fields ──
    if (!customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Email and phone number are required.' },
        { status: 400 }
      );
    }

    if (!deliveryAddress?.trim() || !deliveryCity?.trim() || !deliveryState?.trim() || !deliveryPincode?.trim()) {
      return NextResponse.json(
        { error: 'Complete delivery address (street, city, state, PIN code) is required.' },
        { status: 400 }
      );
    }

    const pinDigits = deliveryPincode.replace(/\D/g, '');
    if (pinDigits.length !== 6) {
      return NextResponse.json(
        { error: 'Please provide a valid 6-digit PIN code.' },
        { status: 400 }
      );
    }

    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit phone number.' },
        { status: 400 }
      );
    }

    // Validate alternate phone if provided
    if (altPhone?.trim()) {
      const altDigits = altPhone.replace(/\D/g, '');
      if (altDigits.length < 10) {
        return NextResponse.json(
          { error: 'Alternate phone must be a valid 10-digit number.' },
          { status: 400 }
        );
      }
    }

    // ── Cart ──
    // Get Clerk userId if signed in (guests get null — orders still work)
    const { userId } = await auth();

    const cartCookie = cookies().get('storeCart')?.value;
    const cartLines = parseCartLines(cartCookie);
    if (cartLines.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    const cart = await getCart(cartLines);
    const subtotal = Number(cart.cost.totalAmount.amount);
    if (subtotal <= 0) {
      return NextResponse.json({ error: 'Cart total must be greater than zero.' }, { status: 400 });
    }

    // ── Apply coupon + shipping (server-side, authoritative) ──
    let shippingAmount = 0;
    try {
      const shippingSettings = await getShippingSettings();
      shippingAmount = computeShipping(subtotal, shippingSettings);
    } catch (shippingErr) {
      console.error('[cashfree/create-order] getShippingSettings failed:', shippingErr);
      // Non-fatal — proceed with free shipping as fallback
      shippingAmount = 0;
    }

    let discountAmount = 0;
    let appliedCouponCode: string | undefined;

    if (couponCode?.trim()) {
      try {
        const validation = await validateCoupon(couponCode.trim(), subtotal);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        discountAmount = validation.discountAmount;
        appliedCouponCode = validation.coupon.code;
      } catch (couponErr) {
        console.error('[cashfree/create-order] validateCoupon failed:', couponErr);
        return NextResponse.json(
          { error: 'Could not validate coupon. Please try again or remove it.' },
          { status: 500 }
        );
      }
    }

    const amount = Math.max(1, parseFloat((subtotal - discountAmount + shippingAmount).toFixed(2)));

    // ── Create Cashfree order ──
    const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const returnUrl = `${siteUrl}/order-success?order_id={order_id}`;

    const cfOrder = await createCashfreeOrder({
      orderId,
      amount,
      currency: 'INR',
      customer: {
        customerId: `cust-${phoneDigits.slice(-10)}`,
        customerEmail,
        customerPhone: phoneDigits.slice(-10),
        customerName: customerName ?? ''
      },
      returnUrl,
      orderNote: `Order — ${cart.totalQuantity} item${cart.totalQuantity === 1 ? '' : 's'} — ${deliveryCity?.trim()}, ${deliveryState?.trim()}`
    });

    // ── Save to Supabase ──
    if (isOrdersDatabaseConfigured()) {
      try {
        const orderItems: OrderItem[] = cart.lines.map((item) => ({
          productId: item.merchandise.product.id,
          productTitle: item.merchandise.product.title,
          variantId: item.merchandise.id,
          variantTitle: item.merchandise.title,
          quantity: item.quantity,
          price: item.cost.totalAmount.amount,
          imageUrl: item.merchandise.product.featuredImage.url
        }));

        await saveOrder({
          orderId,
          userId: userId ?? undefined,
          customerName: customerName ?? '',
          customerEmail,
          customerPhone: phoneDigits.slice(-10),
          altPhone: altPhone?.trim() ? altPhone.replace(/\D/g, '').slice(-10) : undefined,
          deliveryAddress: deliveryAddress.trim(),
          deliveryCity: deliveryCity.trim(),
          deliveryState: deliveryState.trim(),
          deliveryPincode: pinDigits,
          deliveryNote: deliveryNote?.trim() || undefined,
          amount,
          subtotalAmount: subtotal,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          shippingAmount: shippingAmount > 0 ? shippingAmount : undefined,
          couponCode: appliedCouponCode,
          currency: 'INR',
          items: orderItems,
          totalQuantity: cart.totalQuantity,
          cfOrderStatus: cfOrder.orderStatus
        });
        // Increment coupon usage count
        if (appliedCouponCode) {
          void incrementCouponUsage(appliedCouponCode);
        }
      } catch (dbError) {
        console.error('[cashfree/create-order] Failed to save order to database:', dbError);
        // Log the order details so we can recover it manually if needed
        console.error('[cashfree/create-order] Order that failed to save:', {
          orderId,
          customerEmail,
          amount,
          totalQuantity: cart.totalQuantity
        });
      }
    }

    return NextResponse.json({
      paymentSessionId: cfOrder.paymentSessionId,
      orderId: cfOrder.orderId
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('[cashfree/create-order] Unhandled error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
