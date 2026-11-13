import { isCurrentUserAdmin } from 'lib/admin-auth';
import { saveShippingSettings } from 'lib/coupons';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const freeAbove = Number(data.freeAbove ?? 100);
  const standardCharge = Number(data.standardCharge ?? 0);

  if (freeAbove < 0 || standardCharge < 0) {
    return NextResponse.json({ error: 'Values must be non-negative.' }, { status: 400 });
  }

  try {
    await saveShippingSettings({ freeAbove, standardCharge });
    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error('[shipping] save error:', err);
    return NextResponse.json({ error: 'Could not save shipping settings.' }, { status: 500 });
  }
}
