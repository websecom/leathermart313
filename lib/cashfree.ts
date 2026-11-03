/**
 * Cashfree Payment Gateway — server-side helper
 *
 * Uses the official cashfree-pg Node.js SDK (v4+).
 * Docs: https://docs.cashfree.com/docs/payment-gateway
 *
 * The SDK uses instance methods — we create a singleton instance
 * configured from environment variables and export helper functions.
 */

import { Cashfree, CFEnvironment } from 'cashfree-pg';

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;
const env = process.env.CASHFREE_ENV ?? 'sandbox'; // "sandbox" | "production"

if (!appId || !secretKey) {
  console.warn(
    '[cashfree] CASHFREE_APP_ID and CASHFREE_SECRET_KEY are not set. ' +
      'Payment features will not work until you add them to .env.local.'
  );
}

// Create a singleton Cashfree instance
const cfEnvironment =
  env === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

const cashfreeClient = new Cashfree(cfEnvironment, appId ?? '', secretKey ?? '');

export { cashfreeClient as Cashfree };

// ─── Types ───────────────────────────────────────────────────────────────────

export type CashfreeCustomer = {
  /** Unique customer identifier in your system */
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
};

export type CreateOrderParams = {
  /** Unique order ID in your system */
  orderId: string;
  /** Order amount in INR */
  amount: number;
  currency?: string;
  customer: CashfreeCustomer;
  /** Full URL Cashfree redirects to after payment */
  returnUrl: string;
  /** Short note shown on the payment page */
  orderNote?: string;
};

export type CashfreeOrder = {
  orderId: string;
  paymentSessionId: string;
  orderStatus: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create a Cashfree payment order server-side and return the
 * `payment_session_id` needed to launch the payment drop on the client.
 */
export async function createCashfreeOrder(params: CreateOrderParams): Promise<CashfreeOrder> {
  const request = {
    order_id: params.orderId,
    order_amount: params.amount,
    order_currency: params.currency ?? 'INR',
    customer_details: {
      customer_id: params.customer.customerId,
      customer_email: params.customer.customerEmail,
      customer_phone: params.customer.customerPhone,
      customer_name: params.customer.customerName ?? '',
    },
    order_meta: {
      return_url: params.returnUrl,
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/cashfree/webhook`,
    },
    order_note: params.orderNote ?? '',
  };

  const response = await cashfreeClient.PGCreateOrder(request);
  const data = response.data;

  if (!data?.payment_session_id) {
    throw new Error('Cashfree order creation failed: no payment_session_id returned.');
  }

  return {
    orderId: data.order_id ?? params.orderId,
    paymentSessionId: data.payment_session_id,
    orderStatus: data.order_status ?? 'ACTIVE',
  };
}

/**
 * Fetch the current status of a Cashfree order.
 * Use on the return URL page to verify the payment outcome.
 */
export async function getCashfreeOrderStatus(orderId: string): Promise<string> {
  const response = await cashfreeClient.PGFetchOrder(orderId);
  return (response.data as { order_status?: string })?.order_status ?? 'UNKNOWN';
}

/**
 * Verify a Cashfree webhook signature using the dashboard webhook secret.
 *
 * Cashfree signs webhooks with HMAC-SHA256:
 *   signature = base64( HMAC-SHA256( timestamp + rawBody, webhookSecret ) )
 *
 * The webhook secret key is shown in Dashboard → Developers → Webhooks → Secret Key.
 * Store it as CASHFREE_WEBHOOK_SECRET in .env.local (separate from the API secret key).
 *
 * Returns true if valid, false otherwise.
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[cashfree] CASHFREE_WEBHOOK_SECRET is not set — skipping signature verification.');
    // Allow in development; always enforce in production
    return process.env.NODE_ENV !== 'production';
  }

  try {
    // Node's built-in crypto accessed via globalThis to avoid tsconfig lib conflicts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createHmac, timingSafeEqual } = require('crypto') as {
      createHmac: (alg: string, key: string) => { update: (d: string) => { digest: (enc: string) => string } };
      timingSafeEqual: (a: Buffer, b: Buffer) => boolean;
    };

    const message = timestamp + rawBody;
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(message)
      .digest('base64');

    const a = Buffer.from(expectedSignature);
    const b = Buffer.from(signature);

    // Buffers must be same length for timingSafeEqual
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
