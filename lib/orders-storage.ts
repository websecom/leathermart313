import 'server-only';

/**
 * Orders data-access layer.
 *
 * Uses the same Supabase REST (PostgREST) pattern as lib/catalog-storage.ts.
 * The service-role key bypasses RLS so server-side code can read and write
 * the store_orders table.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrderItem = {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  quantity: number;
  price: string;
  imageUrl: string;
};

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'ACTIVE' | 'UNKNOWN';

export type Order = {
  orderId: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  altPhone: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;
  deliveryNote: string | null;
  amount: string;
  subtotalAmount: string | null;
  discountAmount: string | null;
  shippingAmount: string | null;
  couponCode: string | null;
  currency: string;
  paymentStatus: string;
  items: OrderItem[];
  totalQuantity: number;
  cfOrderStatus: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  totalRevenue: string;
};

export type SaveOrderParams = {
  orderId: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  altPhone?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPincode: string;
  deliveryNote?: string;
  amount: number;
  subtotalAmount?: number;
  discountAmount?: number;
  shippingAmount?: number;
  couponCode?: string;
  currency: string;
  items: OrderItem[];
  totalQuantity: number;
  cfOrderStatus?: string;
};

// ─── Supabase helpers ─────────────────────────────────────────────────────────

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/+$/, ''), serviceRoleKey };
}

export function isOrdersDatabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Orders database is not configured.');

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase orders request failed (${response.status}): ${details}`);
  }

  return response;
}

// ─── Row validation ───────────────────────────────────────────────────────────

type OrderRow = {
  order_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  alt_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_pincode: string | null;
  delivery_note: string | null;
  amount: string | number;
  subtotal_amount: string | number | null;
  discount_amount: string | number | null;
  shipping_amount: string | number | null;
  coupon_code: string | null;
  currency: string;
  payment_status: string;
  items: unknown;
  total_quantity: number;
  cf_order_status: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

function validateOrderRow(value: unknown): OrderRow {
  if (!value || typeof value !== 'object') {
    throw new Error('Supabase returned an invalid order row.');
  }
  const row = value as Record<string, unknown>;
  if (
    typeof row.order_id !== 'string' ||
    typeof row.customer_email !== 'string' ||
    typeof row.customer_phone !== 'string' ||
    (typeof row.amount !== 'string' && typeof row.amount !== 'number') ||
    typeof row.currency !== 'string' ||
    typeof row.payment_status !== 'string' ||
    !Array.isArray(row.items) ||
    typeof row.total_quantity !== 'number' ||
    typeof row.created_at !== 'string' ||
    typeof row.updated_at !== 'string'
  ) {
    throw new Error('Supabase returned a malformed order row.');
  }
  return {
    order_id: row.order_id,
    user_id: typeof row.user_id === 'string' ? row.user_id : null,
    customer_name: typeof row.customer_name === 'string' ? row.customer_name : '',
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    alt_phone: typeof row.alt_phone === 'string' ? row.alt_phone : null,
    delivery_address: typeof row.delivery_address === 'string' ? row.delivery_address : null,
    delivery_city: typeof row.delivery_city === 'string' ? row.delivery_city : null,
    delivery_state: typeof row.delivery_state === 'string' ? row.delivery_state : null,
    delivery_pincode: typeof row.delivery_pincode === 'string' ? row.delivery_pincode : null,
    delivery_note: typeof row.delivery_note === 'string' ? row.delivery_note : null,
    amount: String(row.amount),
    subtotal_amount: row.subtotal_amount != null ? (row.subtotal_amount as string | number) : null,
    discount_amount: row.discount_amount != null ? (row.discount_amount as string | number) : null,
    shipping_amount: row.shipping_amount != null ? (row.shipping_amount as string | number) : null,
    coupon_code: typeof row.coupon_code === 'string' ? row.coupon_code : null,
    currency: row.currency,
    payment_status: row.payment_status,
    items: row.items,
    total_quantity: row.total_quantity,
    cf_order_status: typeof row.cf_order_status === 'string' ? row.cf_order_status : null,
    admin_note: typeof row.admin_note === 'string' ? row.admin_note : null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapRowToOrder(row: OrderRow): Order {
  const items: OrderItem[] = (row.items as unknown[]).map((item) => {
    const obj = item as Record<string, unknown>;
    return {
      productId: String(obj.productId ?? ''),
      productTitle: String(obj.productTitle ?? ''),
      variantId: String(obj.variantId ?? ''),
      variantTitle: String(obj.variantTitle ?? ''),
      quantity: Number(obj.quantity ?? 0),
      price: String(obj.price ?? '0'),
      imageUrl: String(obj.imageUrl ?? '')
    };
  });

  return {
    orderId: row.order_id,
    userId: row.user_id ?? null,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    altPhone: row.alt_phone ?? null,
    deliveryAddress: row.delivery_address ?? null,
    deliveryCity: row.delivery_city ?? null,
    deliveryState: row.delivery_state ?? null,
    deliveryPincode: row.delivery_pincode ?? null,
    deliveryNote: row.delivery_note ?? null,
    amount: String(row.amount),
    subtotalAmount: row.subtotal_amount != null ? String(row.subtotal_amount) : null,
    discountAmount: row.discount_amount != null ? String(row.discount_amount) : null,
    shippingAmount: row.shipping_amount != null ? String(row.shipping_amount) : null,
    couponCode: row.coupon_code ?? null,
    currency: row.currency,
    paymentStatus: row.payment_status,
    items,
    totalQuantity: row.total_quantity,
    cfOrderStatus: row.cf_order_status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Insert a new order row when the Cashfree payment order is created.
 * Status starts as PENDING.
 */
export async function saveOrder(params: SaveOrderParams): Promise<void> {
  await supabaseRequest('store_orders', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      order_id: params.orderId,
      user_id: params.userId ?? null,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      alt_phone: params.altPhone ?? null,
      delivery_address: params.deliveryAddress,
      delivery_city: params.deliveryCity,
      delivery_state: params.deliveryState,
      delivery_pincode: params.deliveryPincode,
      delivery_note: params.deliveryNote ?? null,
      amount: params.amount.toFixed(2),
      subtotal_amount: params.subtotalAmount?.toFixed(2) ?? null,
      // These two columns are NOT NULL DEFAULT 0 — send 0 instead of null
      // to avoid violating the NOT NULL constraint.
      discount_amount: (params.discountAmount ?? 0).toFixed(2),
      shipping_amount: (params.shippingAmount ?? 0).toFixed(2),
      coupon_code: params.couponCode ?? null,
      currency: params.currency,
      payment_status: 'PENDING',
      items: params.items,
      total_quantity: params.totalQuantity,
      cf_order_status: params.cfOrderStatus ?? null
    })
  });
}

/**
 * Update the payment status of an existing order.
 * Called from the Cashfree webhook when a payment succeeds, fails, or is pending.
 */
export async function updateOrderStatus(
  orderId: string,
  paymentStatus: string,
  cfOrderStatus?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString()
  };
  if (cfOrderStatus) body.cf_order_status = cfOrderStatus;

  await supabaseRequest(`store_orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  });
}

/**
 * Manually update order status + optional admin note from the admin panel.
 */
export async function updateOrderStatusByAdmin(
  orderId: string,
  paymentStatus: string,
  adminNote: string | null
): Promise<void> {
  const body: Record<string, unknown> = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString()
  };
  body.admin_note = adminNote && adminNote.trim() ? adminNote.trim() : null;

  await supabaseRequest(`store_orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  });
}

/**
 * Update editable customer/delivery fields on an order (admin only).
 */
export async function updateOrderDetails(
  orderId: string,
  details: {
    customerName?: string;
    customerPhone?: string;
    altPhone?: string | null;
    deliveryAddress?: string;
    deliveryCity?: string;
    deliveryState?: string;
    deliveryPincode?: string;
    deliveryNote?: string | null;
  }
): Promise<void> {
  const body: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  if (details.customerName !== undefined)  body.customer_name    = details.customerName.trim();
  if (details.customerPhone !== undefined) body.customer_phone   = details.customerPhone.trim();
  if (details.altPhone !== undefined)      body.alt_phone        = details.altPhone?.trim() || null;
  if (details.deliveryAddress !== undefined) body.delivery_address = details.deliveryAddress.trim();
  if (details.deliveryCity !== undefined)  body.delivery_city    = details.deliveryCity.trim();
  if (details.deliveryState !== undefined) body.delivery_state   = details.deliveryState.trim();
  if (details.deliveryPincode !== undefined) body.delivery_pincode = details.deliveryPincode.trim();
  if (details.deliveryNote !== undefined)  body.delivery_note    = details.deliveryNote?.trim() || null;

  await supabaseRequest(`store_orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  });
}

/**
 * Delete an order permanently (admin only).
 */
export async function deleteOrder(orderId: string): Promise<void> {
  await supabaseRequest(`store_orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: 'DELETE'
  });
}

/**
 * Get all orders, most recent first. Used by the admin orders page.
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const response = await supabaseRequest(
      'store_orders?select=order_id,user_id,customer_name,customer_email,customer_phone,alt_phone,delivery_address,delivery_city,delivery_state,delivery_pincode,delivery_note,amount,subtotal_amount,discount_amount,shipping_amount,coupon_code,currency,payment_status,items,total_quantity,cf_order_status,admin_note,created_at,updated_at&order=created_at.desc'
    );
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) throw new Error('Supabase returned an invalid orders response.');
    return rows.map((row) => mapRowToOrder(validateOrderRow(row)));
  } catch (err) {
    // If the query fails (e.g. new columns not yet migrated), fall back to base columns
    console.warn('[orders] Full query failed, trying base columns:', err);
    const response = await supabaseRequest(
      'store_orders?select=order_id,user_id,customer_name,customer_email,customer_phone,alt_phone,delivery_address,delivery_city,delivery_state,delivery_pincode,delivery_note,amount,currency,payment_status,items,total_quantity,cf_order_status,admin_note,created_at,updated_at&order=created_at.desc'
    );
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) throw new Error('Supabase returned an invalid orders response.');
    return rows.map((row) => mapRowToOrder(validateOrderRow(row)));
  }
}

/**
 * Get orders for a specific customer, most recent first.
 * Queries by Clerk userId first (reliable), falls back to email match.
 * Used by the customer "My Orders" page.
 */
export async function getOrdersByEmail(
  email: string,
  userId?: string
): Promise<Order[]> {
  if (!isOrdersDatabaseConfigured()) return [];

  const SELECT =
    'order_id,user_id,customer_name,customer_email,customer_phone,alt_phone,' +
    'delivery_address,delivery_city,delivery_state,delivery_pincode,delivery_note,' +
    'amount,subtotal_amount,discount_amount,shipping_amount,coupon_code,' +
    'currency,payment_status,items,total_quantity,cf_order_status,admin_note,' +
    'created_at,updated_at';

  // Build filter.
  // PostgREST's `or` filter is placed as a query parameter: or=(col.eq.val,col.eq.val)
  // Values that contain special characters (like @ in emails) must NOT be
  // encodeURIComponent-encoded inside the parentheses — PostgREST parses them
  // as raw strings. We only encode the outer query parameter key/value pair.
  let filter: string;
  if (userId) {
    // Match by userId OR email so orders placed before sign-in also appear.
    // Encode the whole `or=(...)` value as a single query string param.
    const orValue = `(user_id.eq.${userId},customer_email.eq.${email})`;
    filter = `or=${encodeURIComponent(orValue)}`;
  } else {
    filter = `customer_email=eq.${encodeURIComponent(email)}`;
  }

  try {
    const response = await supabaseRequest(
      `store_orders?select=${SELECT}&${filter}&order=created_at.desc`
    );
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => mapRowToOrder(validateOrderRow(row)));
  } catch (err) {
    console.error('[orders] getOrdersByEmail failed:', err);
    return [];
  }
}

/**
 * Get summary stats for the admin dashboard.
 * If the database is not configured, returns zeroed stats.
 */
export async function getOrderStats(): Promise<OrderStats> {
  if (!isOrdersDatabaseConfigured()) {
    return {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      failedOrders: 0,
      totalRevenue: '0.00'
    };
  }

  const orders = await getOrders();
  const paid = orders.filter((o) => o.paymentStatus === 'PAID');
  const pending = orders.filter(
    (o) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'ACTIVE'
  );
  const failed = orders.filter((o) => o.paymentStatus === 'FAILED');
  const revenue = paid.reduce((sum, o) => sum + Number(o.amount), 0);

  return {
    totalOrders: orders.length,
    paidOrders: paid.length,
    pendingOrders: pending.length,
    failedOrders: failed.length,
    totalRevenue: revenue.toFixed(2)
  };
}
