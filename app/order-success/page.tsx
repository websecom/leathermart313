/**
 * Order Success / Return URL page
 *
 * Cashfree redirects here after payment with ?order_id=<id>
 * We verify the payment status server-side and show the appropriate UI.
 */

import { getCashfreeOrderStatus } from 'lib/cashfree';
import { isOrdersDatabaseConfigured, updateOrderStatus } from 'lib/orders-storage';
import Link from 'next/link';

export const metadata = {
  title: 'Order Confirmation',
  description: 'Your payment status.'
};

// Prevent this page from being cached — payment status must always be fresh
export const dynamic = 'force-dynamic';

type SearchParams = {
  order_id?: string;
};

export default async function OrderSuccessPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const orderId = searchParams.order_id;

  // If no order_id, the user navigated here directly
  if (!orderId) {
    return <OrderMessage status="UNKNOWN" />;
  }

  let status = 'UNKNOWN';
  try {
    status = await getCashfreeOrderStatus(orderId);
  } catch (error) {
    console.error('[order-success] Failed to fetch order status:', error);
    status = 'PENDING';
  }

  // If Cashfree confirms payment, update the DB immediately — don't wait for webhook.
  // This handles cases where the webhook is delayed or not yet configured.
  if (isOrdersDatabaseConfigured()) {
    try {
      if (status === 'PAID') {
        await updateOrderStatus(orderId, 'PAID', status);
      } else if (status === 'ACTIVE' || status === 'PENDING') {
        // Leave as PENDING — webhook will update when payment completes
      } else if (status === 'CANCELLED' || status === 'TERMINATED' || status === 'EXPIRED') {
        await updateOrderStatus(orderId, 'FAILED', status);
      }
    } catch (dbError) {
      console.error('[order-success] Failed to update order status in DB:', dbError);
    }
  }

  return <OrderMessage status={status} orderId={orderId} />;
}

// ─── UI sub-component ─────────────────────────────────────────────────────────

function OrderMessage({
  status,
  orderId
}: {
  status: string;
  orderId?: string;
}) {
  const isPaid = status === 'PAID';
  const isPending =
    status === 'ACTIVE' ||
    status === 'PENDING' ||
    status === 'UNKNOWN';
  const isFailed = !isPaid && !isPending;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center px-4 py-16 text-center">

      {/* Icon */}
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          isPaid
            ? 'bg-[#edf3e7] text-[#3d7a3d]'
            : isPending
              ? 'bg-yellow-50 text-yellow-600'
              : 'bg-red-50 text-red-500'
        }`}
      >
        {isPaid ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : isPending ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 6v6l4 2" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Heading */}
      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#17211f]">
        {isPaid
          ? 'Payment successful!'
          : isPending
            ? 'Payment is being verified'
            : 'Payment not completed'}
      </h1>

      {/* Body */}
      <p className="mt-3 text-[13px] leading-6 text-[#68736b]">
        {isPaid ? (
          <>
            Thank you for your order. We will process and dispatch it shortly.
            {orderId && (
              <>
                {' '}Your order reference is{' '}
                <span className="font-mono font-medium text-[#17211f]">
                  {orderId.slice(-12).toUpperCase()}
                </span>.
              </>
            )}
          </>
        ) : isPending ? (
          <>
            Your payment is being processed. This usually takes a few seconds.
            {' '}We will confirm your order via WhatsApp or email shortly.
            {orderId && (
              <>
                {' '}Order reference:{' '}
                <span className="font-mono font-medium text-[#17211f]">
                  {orderId.slice(-12).toUpperCase()}
                </span>.
              </>
            )}
          </>
        ) : (
          <>
            Your payment could not be completed. No money has been charged.
            {' '}Please try again or contact us on{' '}
            <a href="tel:09326569083" className="font-medium text-[#17211f] underline">
              093265 69083
            </a>.
          </>
        )}
      </p>

      {/* Sub info for pending */}
      {isPending && (
        <div className="mt-4 rounded-xl border border-[#e8d9c4] bg-[#fbf7ee] px-4 py-3 text-[12px] text-[#8a6d27]">
          If you have already paid, your order has been received. Check{' '}
          <Link href="/orders" className="font-semibold underline">
            My Orders
          </Link>{' '}
          in a few minutes to see the confirmed status.
        </div>
      )}

      {/* CTA buttons */}
      <div className="mt-8 flex flex-col items-center gap-3">
        {isPaid ? (
          <>
            <Link
              href="/orders"
              className="rounded-full bg-[#172c27] px-6 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d]"
            >
              View my orders
            </Link>
            <Link
              href="/"
              className="text-[12px] font-medium text-[#627067] hover:text-[#172c27]"
            >
              Continue shopping
            </Link>
          </>
        ) : isPending ? (
          <>
            <Link
              href="/orders"
              className="rounded-full bg-[#172c27] px-6 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d]"
            >
              Check my orders
            </Link>
            <Link
              href="/"
              className="text-[12px] font-medium text-[#627067] hover:text-[#172c27]"
            >
              Continue shopping
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/checkout"
              className="rounded-full bg-[#172c27] px-6 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d]"
            >
              Try again
            </Link>
            <a
              href="https://wa.me/919326569083?text=Hi%2C%20I%20had%20a%20payment%20issue%20with%20my%20order."
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-medium text-[#627067] hover:text-[#172c27]"
            >
              Contact us on WhatsApp
            </a>
          </>
        )}
      </div>

      {/* Security badge */}
      <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-[#b0b8ae]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span>Payment secured by Cashfree Payments</span>
      </div>

    </div>
  );
}
