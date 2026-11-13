import { isCurrentUserAdmin } from 'lib/admin-auth';
import {
    deleteOrder,
    updateOrderDetails,
    updateOrderStatusByAdmin
} from 'lib/orders-storage';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = [
  'PENDING', 'ACTIVE', 'PAID',
  'PREPARING', 'DISPATCHED', 'DELIVERED',
  'FAILED', 'REFUNDED', 'CANCELLED'
] as const;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** PATCH — update status + note */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isCurrentUserAdmin())) return jsonError('Admin access required.', 401);

  const orderId = params.id;
  if (!orderId) return jsonError('Order ID is required.', 400);

  let body: unknown;
  try { body = await request.json(); } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const { paymentStatus, adminNote } = body as {
    paymentStatus?: unknown;
    adminNote?: unknown;
  };

  if (
    typeof paymentStatus !== 'string' ||
    !ALLOWED_STATUSES.includes(paymentStatus as typeof ALLOWED_STATUSES[number])
  ) {
    return jsonError(`paymentStatus must be one of: ${ALLOWED_STATUSES.join(', ')}.`, 400);
  }

  if (adminNote !== undefined && adminNote !== null && typeof adminNote !== 'string') {
    return jsonError('adminNote must be a string or null.', 400);
  }
  if (typeof adminNote === 'string' && adminNote.length > 500) {
    return jsonError('adminNote must be 500 characters or fewer.', 400);
  }

  try {
    await updateOrderStatusByAdmin(
      orderId,
      paymentStatus,
      typeof adminNote === 'string' ? adminNote : null
    );
  } catch (error) {
    console.error('[admin/orders] Failed to update order status:', error);
    return jsonError('Could not update the order.', 502);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  return NextResponse.json({ updated: true });
}

/** PUT — edit customer / delivery details */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isCurrentUserAdmin())) return jsonError('Admin access required.', 401);

  const orderId = params.id;
  if (!orderId) return jsonError('Order ID is required.', 400);

  let body: unknown;
  try { body = await request.json(); } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const d = body as Record<string, unknown>;

  // Basic validation
  if (d.customerPhone && typeof d.customerPhone === 'string') {
    const digits = d.customerPhone.replace(/\D/g, '');
    if (digits.length < 10) return jsonError('Phone must be at least 10 digits.', 400);
  }
  if (d.deliveryPincode && typeof d.deliveryPincode === 'string') {
    if (!/^\d{6}$/.test(d.deliveryPincode.replace(/\D/g, ''))) {
      return jsonError('PIN code must be 6 digits.', 400);
    }
  }

  try {
    await updateOrderDetails(orderId, {
      customerName:    typeof d.customerName === 'string'    ? d.customerName    : undefined,
      customerPhone:   typeof d.customerPhone === 'string'   ? d.customerPhone   : undefined,
      altPhone:        d.altPhone !== undefined ? (typeof d.altPhone === 'string' ? d.altPhone : null) : undefined,
      deliveryAddress: typeof d.deliveryAddress === 'string' ? d.deliveryAddress : undefined,
      deliveryCity:    typeof d.deliveryCity === 'string'    ? d.deliveryCity    : undefined,
      deliveryState:   typeof d.deliveryState === 'string'   ? d.deliveryState   : undefined,
      deliveryPincode: typeof d.deliveryPincode === 'string' ? d.deliveryPincode : undefined,
      deliveryNote:    d.deliveryNote !== undefined ? (typeof d.deliveryNote === 'string' ? d.deliveryNote : null) : undefined,
    });
  } catch (error) {
    console.error('[admin/orders] Failed to update order details:', error);
    return jsonError('Could not update order details.', 502);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  return NextResponse.json({ updated: true });
}

/** DELETE — permanently delete an order */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isCurrentUserAdmin())) return jsonError('Admin access required.', 401);

  const orderId = params.id;
  if (!orderId) return jsonError('Order ID is required.', 400);

  try {
    await deleteOrder(orderId);
  } catch (error) {
    console.error('[admin/orders] Failed to delete order:', error);
    return jsonError('Could not delete the order.', 502);
  }

  revalidatePath('/admin/orders');
  return NextResponse.json({ deleted: true });
}
