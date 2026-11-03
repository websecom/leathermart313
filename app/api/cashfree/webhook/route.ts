/**
 * POST /api/cashfree/webhook
 *
 * Receives Cashfree payment event notifications.
 * Cashfree calls this URL when a payment succeeds, fails, or is pending.
 *
 * Configure this URL in your Cashfree dashboard:
 *   Webhook URL → https://<your-domain>/api/cashfree/webhook
 *
 * Cashfree sends the following headers:
 *   x-webhook-timestamp  — Unix timestamp of the event
 *   x-webhook-signature  — HMAC-SHA256 signature for verification
 */

import { verifyCashfreeWebhookSignature } from 'lib/cashfree';
import { updateOrderStatus, isOrdersDatabaseConfigured } from 'lib/orders-storage';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Disable body parsing — we need the raw body for signature verification
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get('x-webhook-timestamp') ?? '';
    const signature = request.headers.get('x-webhook-signature') ?? '';

    // 1. Verify the webhook signature
    const isValid = verifyCashfreeWebhookSignature(rawBody, timestamp, signature);
    if (!isValid) {
      console.warn('[cashfree/webhook] Invalid signature — request rejected.');
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    // 2. Parse the payload
    const event = JSON.parse(rawBody) as Record<string, unknown>;
    const type = event.type as string | undefined;
    const data = event.data as Record<string, unknown> | undefined;
    const order = data?.order as Record<string, unknown> | undefined;
    const payment = data?.payment as Record<string, unknown> | undefined;

    const orderId = order?.order_id as string | undefined;
    const orderStatus = order?.order_status as string | undefined;
    const paymentStatus = payment?.payment_status as string | undefined;

    console.log('[cashfree/webhook]', { type, orderId, orderStatus, paymentStatus });

    // 3. Handle event types
    switch (type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
      case 'PAYMENT_SUCCESS': {
        console.log(`[cashfree/webhook] Payment SUCCESS for order ${orderId}`);
        if (isOrdersDatabaseConfigured() && orderId) {
          try {
            await updateOrderStatus(orderId, 'PAID', orderStatus);
          } catch (dbError) {
            console.error('[cashfree/webhook] Failed to update order status to PAID:', dbError);
          }
        }
        break;
      }

      case 'PAYMENT_FAILED_WEBHOOK':
      case 'PAYMENT_FAILED': {
        console.log(`[cashfree/webhook] Payment FAILED for order ${orderId}`);
        if (isOrdersDatabaseConfigured() && orderId) {
          try {
            await updateOrderStatus(orderId, 'FAILED', orderStatus);
          } catch (dbError) {
            console.error('[cashfree/webhook] Failed to update order status to FAILED:', dbError);
          }
        }
        break;
      }

      case 'PAYMENT_PENDING': {
        console.log(`[cashfree/webhook] Payment PENDING for order ${orderId}`);
        if (isOrdersDatabaseConfigured() && orderId) {
          try {
            await updateOrderStatus(orderId, 'PENDING', orderStatus);
          } catch (dbError) {
            console.error('[cashfree/webhook] Failed to update order status to PENDING:', dbError);
          }
        }
        break;
      }

      default:
        console.log(`[cashfree/webhook] Unhandled event type: ${type}`);
    }

    // Cashfree expects a 200 response to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[cashfree/webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
