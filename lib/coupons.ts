import 'server-only';

export type Coupon = {
  id: number;
  code: string;
  type: 'percent' | 'amount';
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  description: string;
  createdAt: string;
};

export type CouponValidation =
  | { valid: true; coupon: Coupon; discountAmount: number; message: string }
  | { valid: false; error: string };

function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function supabase(path: string, init?: RequestInit) {
  const config = getConfig();
  if (!config) throw new Error('Supabase is not configured.');
  const res = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase coupons error (${res.status}): ${detail}`);
  }
  return res;
}

type CouponRow = Record<string, unknown>;

function mapRow(row: CouponRow): Coupon {
  return {
    id:              Number(row.id),
    code:            String(row.code).toUpperCase(),
    type:            String(row.type) as 'percent' | 'amount',
    value:           Number(row.value),
    minOrderAmount:  Number(row.min_order_amount ?? 0),
    maxUses:         row.max_uses != null ? Number(row.max_uses) : null,
    usedCount:       Number(row.used_count ?? 0),
    active:          Boolean(row.active),
    expiresAt:       row.expires_at ? String(row.expires_at) : null,
    description:     String(row.description ?? ''),
    createdAt:       String(row.created_at)
  };
}

/** Validate a coupon code against an order subtotal. Server-side only. */
export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidation> {
  const config = getConfig();
  if (!config) return { valid: false, error: 'Coupon service unavailable.' };

  const upper = code.trim().toUpperCase();
  if (!upper) return { valid: false, error: 'Enter a coupon code.' };

  try {
    const res = await supabase(
      `store_coupons?code=eq.${encodeURIComponent(upper)}&limit=1`
    );
    const rows = (await res.json()) as CouponRow[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return { valid: false, error: 'Invalid coupon code.' };
    }
    const coupon = mapRow(rows[0]!);

    if (!coupon.active) return { valid: false, error: 'This coupon is no longer active.' };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: 'This coupon has expired.' };
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: 'This coupon has reached its usage limit.' };
    }
    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        error: `Minimum order ₹${coupon.minOrderAmount.toFixed(2)} required for this coupon.`
      };
    }

    const discountAmount =
      coupon.type === 'percent'
        ? parseFloat(((subtotal * coupon.value) / 100).toFixed(2))
        : Math.min(coupon.value, subtotal); // amount off, can't exceed subtotal

    const message =
      coupon.type === 'percent'
        ? `${coupon.value}% off applied — ₹${discountAmount.toFixed(2)} saved`
        : `₹${discountAmount.toFixed(2)} off applied`;

    return { valid: true, coupon, discountAmount, message };
  } catch (err) {
    console.error('[coupons] validateCoupon error:', err);
    return { valid: false, error: 'Could not validate coupon. Please try again.' };
  }
}

/** Increment use count after a successful order. */
export async function incrementCouponUsage(code: string): Promise<void> {
  const config = getConfig();
  if (!config) return;
  try {
    // Use Supabase RPC to atomically increment
    const upper = code.trim().toUpperCase();
    await supabase(`store_coupons?code=eq.${encodeURIComponent(upper)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ used_count: { raw: 'used_count + 1' } })
    });
  } catch { /* non-fatal */ }
}

/** Get all coupons for admin. */
export async function getAllCoupons(): Promise<Coupon[]> {
  const config = getConfig();
  if (!config) return [];
  try {
    const res = await supabase('store_coupons?order=created_at.desc');
    const rows = (await res.json()) as CouponRow[];
    return Array.isArray(rows) ? rows.map(mapRow) : [];
  } catch { return []; }
}

/** Create a coupon. */
export async function createCoupon(data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>): Promise<void> {
  await supabase('store_coupons', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      code:              data.code.trim().toUpperCase(),
      type:              data.type,
      value:             data.value,
      min_order_amount:  data.minOrderAmount,
      max_uses:          data.maxUses,
      active:            data.active,
      expires_at:        data.expiresAt || null,
      description:       data.description.trim()
    })
  });
}

/** Update a coupon. */
export async function updateCoupon(id: number, data: Partial<Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>>): Promise<void> {
  const body: Record<string, unknown> = {};
  if (data.code !== undefined)            body.code = data.code.trim().toUpperCase();
  if (data.type !== undefined)            body.type = data.type;
  if (data.value !== undefined)           body.value = data.value;
  if (data.minOrderAmount !== undefined)  body.min_order_amount = data.minOrderAmount;
  if (data.maxUses !== undefined)         body.max_uses = data.maxUses;
  if (data.active !== undefined)          body.active = data.active;
  if (data.expiresAt !== undefined)       body.expires_at = data.expiresAt || null;
  if (data.description !== undefined)     body.description = data.description.trim();

  await supabase(`store_coupons?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  });
}

/** Delete a coupon. */
export async function deleteCoupon(id: number): Promise<void> {
  await supabase(`store_coupons?id=eq.${id}`, { method: 'DELETE' });
}

/** Get shipping settings. */
export type ShippingSettings = {
  freeAbove: number;
  standardCharge: number;
};

export async function getShippingSettings(): Promise<ShippingSettings> {
  const config = getConfig();
  if (!config) return { freeAbove: 100, standardCharge: 0 };
  try {
    const res = await supabase('store_shipping_settings?id=eq.default&limit=1');
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows) || rows.length === 0) return { freeAbove: 100, standardCharge: 0 };
    const row = rows[0]!;
    return {
      freeAbove:      Number(row.free_above ?? 100),
      standardCharge: Number(row.standard_charge ?? 0),
    };
  } catch { return { freeAbove: 100, standardCharge: 0 }; }
}

export async function saveShippingSettings(settings: ShippingSettings): Promise<void> {
  await supabase('store_shipping_settings?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id:               'default',
      free_above:       settings.freeAbove,
      standard_charge:  settings.standardCharge,
      updated_at:       new Date().toISOString()
    })
  });
}

export function computeShipping(subtotal: number, settings: ShippingSettings): number {
  return subtotal >= settings.freeAbove ? 0 : settings.standardCharge;
}
