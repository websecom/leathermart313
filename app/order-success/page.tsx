/**
 * Order Success / Return URL page
 *
 * Cashfree redirects here after payment with ?order_id=<id>
 * We verify the payment status server-side and show the appropriate UI.
 */

import { getCashfreeOrderStatus } from 'lib/cashfree';
import { cookies } from 'next/headers';
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
    return <OrderMessage status="invalid" />;
  }

  let status = 'UNKNOWN';
  try {
    status = await getCashfreeOrderStatus(orderId);
  } catch (error) {
    console.error('[order-success] Failed to fetch order status:', error);
    status = 'ERROR';
  }

  // Clear the cart cookie on successful payment
  if (status === 'PAID') {
    cookies().delete('storeCart');
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
  const isPending = status === 'ACTIVE' || status === 'PENDING';
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
            ? 'Payment pending'
            : 'Payment not completed'}
      </h1>

      {/* Body */}
      <p className="mt-3 text-[13px] leading-6 text-[#68736b]">
        {isPaid ? (
          <>
            Thank you for your order. A confirmation will be sent to your email shortly.
            {orderId && (
              <>
                {' '}Your order reference is{' '}
                <span className="font-medium text-[#17211f]">{orderId}</span>.
              </>
            )}
          </>
        ) : isPending ? (
          <>
            Your payment is being processed. We&apos;ll notify you by email once it&apos;s confirmed.
            {orderId && (
              <>
                {' '}Order reference:{' '}
                <span className="font-medium text-[#17211f]">{orderId}</span>.
              </>
            )}
          </>
        ) : (
          'Your payment was not completed. You can go back and try again — your cart has been saved.'
        )}
      </p>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3">
        {isPaid ? (
          <Link
            href="/"
            className="rounded-full bg-[#172c27] px-6 py-3 text-[12px] font-semibold text-white hover:bg-[#27483d]"
          >
            Continue shopping
          </Link>
        ) : (
          <>
            <Link
              href="/checkout"
              className="rounded-full bg-[#172c27] px-6 py-3 text-[12px] font-semibold text-white hover:bg-[#27483d]"
            >
              Return to checkout
            </Link>
            <Link
              href="/"
              className="text-[12px] font-medium text-[#627067] hover:text-[#172c27]"
            >
              Continue shopping
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
