import { isCurrentUserAdmin } from 'lib/admin-auth';
import { updateCoupon, deleteCoupon } from 'lib/coupons';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid coupon ID.' }, { status: 400 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const update: Parameters<typeof updateCoupon>[1] = {};

  if (typeof data.code === 'string')          update.code = data.code;
  if (data.type === 'percent' || data.type === 'amount') update.type = data.type;
  if (typeof data.value === 'number')         update.value = data.value;
  if (typeof data.minOrderAmount === 'number') update.minOrderAmount = data.minOrderAmount;
  if (data.maxUses !== undefined)             update.maxUses = data.maxUses != null ? Number(data.maxUses) : null;
  if (typeof data.active === 'boolean')       update.active = data.active;
  if (data.expiresAt !== undefined)           update.expiresAt = data.expiresAt as string | null;
  if (typeof data.description === 'string')   update.description = data.description;

  try {
    await updateCoupon(id, update);
    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error('[coupons] update error:', err);
    return NextResponse.json({ error: 'Could not update coupon.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid coupon ID.' }, { status: 400 });
  }

  try {
    await deleteCoupon(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[coupons] delete error:', err);
    return NextResponse.json({ error: 'Could not delete coupon.' }, { status: 500 });
  }
}
