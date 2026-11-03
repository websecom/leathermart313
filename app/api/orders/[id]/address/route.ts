/**
 * PATCH /api/orders/[id]/address
 *
 * Allows a signed-in user to update the delivery address and notes
 * on their own order — only allowed before it's dispatched.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrdersByEmail, updateOrderDetails } from 'lib/orders-storage';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Orders that can no longer be edited (already in transit or closed)
const LOCKED_STATUSES = new Set(['DISPATCHED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── Auth ──
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to update your order.' }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!email) {
    return NextResponse.json({ error: 'Could not verify your account.' }, { status: 401 });
  }

  // ── Verify order belongs to this user ──
  const orders = await getOrdersByEmail(email, userId);
  const order = orders.find((o) => o.orderId === params.id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  // ── Check editability ──
  if (LOCKED_STATUSES.has(order.paymentStatus)) {
    return NextResponse.json(
      { error: `Cannot edit address — order is already ${order.paymentStatus.toLowerCase()}.` },
      { status: 403 }
    );
  }

  // ── Parse body ──
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const d = body as Record<string, unknown>;

  // Validate phone
  if (d.customerPhone && typeof d.customerPhone === 'string') {
    const digits = d.customerPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ error: 'Phone must be at least 10 digits.' }, { status: 400 });
    }
  }

  // Validate PIN
  if (d.deliveryPincode && typeof d.deliveryPincode === 'string') {
    if (!/^\d{6}$/.test(d.deliveryPincode.replace(/\D/g, ''))) {
      return NextResponse.json({ error: 'PIN code must be 6 digits.' }, { status: 400 });
    }
  }

  // Require at least street + city + state + PIN if address is being set
  const hasAddress = d.deliveryAddress || d.deliveryCity || d.deliveryState || d.deliveryPincode;
  if (hasAddress) {
    if (!d.deliveryAddress || !d.deliveryCity || !d.deliveryState || !d.deliveryPincode) {
      return NextResponse.json(
        { error: 'Provide complete address: street, city, state, and PIN code.' },
        { status: 400 }
      );
    }
  }

  // ── Save ──
  try {
    await updateOrderDetails(params.id, {
      customerPhone:   typeof d.customerPhone === 'string'   ? d.customerPhone.trim()   : undefined,
      altPhone:        d.altPhone !== undefined
                         ? (typeof d.altPhone === 'string' ? d.altPhone.trim() : null)
                         : undefined,
      deliveryAddress: typeof d.deliveryAddress === 'string' ? d.deliveryAddress.trim() : undefined,
      deliveryCity:    typeof d.deliveryCity === 'string'    ? d.deliveryCity.trim()    : undefined,
      deliveryState:   typeof d.deliveryState === 'string'   ? d.deliveryState.trim()   : undefined,
      deliveryPincode: typeof d.deliveryPincode === 'string' ? d.deliveryPincode.replace(/\D/g, '') : undefined,
      deliveryNote:    d.deliveryNote !== undefined
                         ? (typeof d.deliveryNote === 'string' ? d.deliveryNote.trim() : null)
                         : undefined,
    });
  } catch (error) {
    console.error('[orders/address] update error:', error);
    return NextResponse.json({ error: 'Could not update the address. Please try again.' }, { status: 502 });
  }

  revalidatePath(`/orders/${params.id}`);
  return NextResponse.json({ updated: true });
}
