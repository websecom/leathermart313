import { isCurrentUserAdmin } from 'lib/admin-auth';
import { createCoupon, getAllCoupons } from 'lib/coupons';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  const coupons = await getAllCoupons();
  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const s = body as Record<string, unknown>;
  const code = typeof s.code === 'string' ? s.code.trim().toUpperCase() : '';
  const type = s.type as 'percent' | 'amount';
  const value = Number(s.value);

  if (!code) return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
  if (!['percent', 'amount'].includes(type)) return NextResponse.json({ error: 'Type must be percent or amount.' }, { status: 400 });
  if (!value || value <= 0) return NextResponse.json({ error: 'Value must be positive.' }, { status: 400 });
  if (type === 'percent' && value > 100) return NextResponse.json({ error: 'Percentage cannot exceed 100.' }, { status: 400 });

  try {
    await createCoupon({
      code, type, value,
      minOrderAmount: Number(s.minOrderAmount ?? 0),
      maxUses: s.maxUses != null && s.maxUses !== '' ? Number(s.maxUses) : null,
      active: s.active !== false,
      expiresAt: typeof s.expiresAt === 'string' && s.expiresAt ? s.expiresAt : null,
      description: typeof s.description === 'string' ? s.description : ''
    });
    return NextResponse.json({ created: true });
  } catch (err) {
    console.error('[coupons] create error:', err);
    const msg = err instanceof Error && err.message.includes('unique') ? 'A coupon with this code already exists.' : 'Could not create coupon.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
