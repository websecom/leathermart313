import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrdersByEmail, type Order } from 'lib/orders-storage';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/* ── Journey steps ── */
const JOURNEY_STEPS = [
  { key: 'placed',     label: 'Order placed',       sub: 'We received your order',            activeFor: ['PAID','PREPARING','DISPATCHED','DELIVERED'] },
  { key: 'confirmed',  label: 'Payment confirmed',   sub: 'Payment successfully processed',   activeFor: ['PAID','PREPARING','DISPATCHED','DELIVERED'] },
  { key: 'preparing',  label: 'Preparing',           sub: 'Your order is being packed',       activeFor: ['PREPARING','DISPATCHED','DELIVERED'] },
  { key: 'dispatched', label: 'Dispatched',          sub: 'On its way to you',                activeFor: ['DISPATCHED','DELIVERED'] },
  { key: 'delivered',  label: 'Delivered',           sub: 'Enjoy your order!',                activeFor: ['DELIVERED'] }
] as const;

function currentStepIndex(status: string): number {
  if (status === 'DELIVERED')  return 4;
  if (status === 'DISPATCHED') return 3;
  if (status === 'PREPARING')  return 2;
  if (status === 'PAID')       return 1;
  return 0;
}

function showJourney(status: string): boolean {
  return ['PAID','PREPARING','DISPATCHED','DELIVERED'].includes(status);
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PAID:       { cls: 'bg-[#edf3e7] text-[#3d6b24]', label: '✓ Paid' },
    PREPARING:  { cls: 'bg-[#e8f0fb] text-[#2d5096]', label: '⚙ Preparing' },
    DISPATCHED: { cls: 'bg-[#e8f0fb] text-[#2d5096]', label: '🚚 Dispatched' },
    DELIVERED:  { cls: 'bg-[#edf3e7] text-[#304a2a]', label: '✓ Delivered' },
    PENDING:    { cls: 'bg-[#fbf7e9] text-[#8a6d27]', label: '⏱ Pending' },
    ACTIVE:     { cls: 'bg-[#fbf7e9] text-[#8a6d27]', label: '⏱ Processing' },
    FAILED:     { cls: 'bg-[#fbefec] text-[#9a392d]', label: '✕ Failed' },
    REFUNDED:   { cls: 'bg-[#f0f2ed] text-[#788179]', label: '↩ Refunded' },
    CANCELLED:  { cls: 'bg-[#f0f2ed] text-[#788179]', label: '✕ Cancelled' },
  };
  const { cls, label } = map[status] ?? { cls: 'bg-[#f0f2ed] text-[#788179]', label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${cls}`}>
      {label}
    </span>
  );
}

/* ── Order journey tracker ── */
function OrderJourney({ status }: { status: string }) {
  const activeIdx = currentStepIndex(status);
  return (
    <div className="px-5 py-6 sm:px-8">
      <div className="relative flex items-start justify-between">
        {JOURNEY_STEPS.map((step, i) => {
          const isActive = i <= activeIdx;
          const isCurrent = i === activeIdx;
          const isLast = i === JOURNEY_STEPS.length - 1;
          return (
            <div key={step.key} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <div className="absolute left-0 right-1/2 top-[13px] h-[2px] -translate-y-px">
                  <div className="h-full w-full bg-[#e1e7de]" />
                  {i <= activeIdx && <div className="absolute inset-0 h-full w-full bg-[#172c27] transition-all duration-500" />}
                </div>
              )}
              {!isLast && (
                <div className="absolute left-1/2 right-0 top-[13px] h-[2px] -translate-y-px">
                  <div className="h-full w-full bg-[#e1e7de]" />
                  {i < activeIdx && <div className="absolute inset-0 h-full w-full bg-[#172c27] transition-all duration-500" />}
                </div>
              )}
              <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                isActive
                  ? isCurrent && status !== 'DELIVERED'
                    ? 'border-[#172c27] bg-[#172c27] shadow-[0_0_0_4px_rgba(23,44,39,0.12)]'
                    : 'border-[#172c27] bg-[#172c27]'
                  : 'border-[#d0daca] bg-white'
              }`}>
                {isActive ? (
                  <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[#d0daca]" />
                )}
              </div>
              <div className="mt-2.5 text-center">
                <p className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-[#17211f]' : 'text-[#b0b8ae]'}`}>
                  {step.label}
                </p>
                <p className={`mt-0.5 hidden text-[9px] leading-tight sm:block ${isActive ? 'text-[#68736b]' : 'text-[#c8cdc6]'}`}>
                  {step.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default async function OrderDetailPage({
  params
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/orders/${params.id}`);

  const user = await currentUser();
  const email = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  const orders = email ? await getOrdersByEmail(email, userId ?? undefined) : [];
  const order: Order | undefined = orders.find((o) => o.orderId === params.id);

  if (!order) notFound();

  const showTracker = showJourney(order.paymentStatus);
  const isFailed = order.paymentStatus === 'FAILED';
  const isCancelled = order.paymentStatus === 'CANCELLED' || order.paymentStatus === 'REFUNDED';

  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

      {/* ── Back ── */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
      >
        ← Back to my orders
      </Link>

      {/* ── Header ── */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">Order</p>
          <h1 className="mt-1 break-all font-mono text-lg font-semibold text-[#17211f]">
            {order.orderId}
          </h1>
          <p className="mt-1 text-[12px] text-[#788179]">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.paymentStatus} />
          {order.paymentStatus === 'DELIVERED' && (
            <Link
              href={`/orders/${order.orderId}/invoice`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#c8ddb8] bg-[#edf3e7] px-3.5 py-1.5 text-[11px] font-semibold text-[#3d6b24] transition-colors hover:bg-[#c6f36b] hover:text-[#17211f] hover:border-[#c6f36b]"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M8 1a.75.75 0 01.75.75v6.19l1.97-1.97a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.03a.75.75 0 011.06-1.06l1.97 1.97V1.75A.75.75 0 018 1zM2.5 13.25a.75.75 0 000 1.5h11a.75.75 0 000-1.5h-11z" />
              </svg>
              Download invoice
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">

        {/* ── Journey tracker ── */}
        {showTracker && (
          <div className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-gradient-to-b from-[#f5f8ef] to-[#fbfcfa]">
            <div className="border-b border-[#e8ece6] px-5 py-3 sm:px-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">
                Order tracking
              </p>
            </div>
            <OrderJourney status={order.paymentStatus} />
          </div>
        )}

        {/* ── Failed / cancelled ── */}
        {(isFailed || isCancelled) && (
          <div className={`rounded-2xl border px-5 py-4 ${isFailed ? 'border-[#f5c9c4] bg-[#fff8f7]' : 'border-[#e1e7de] bg-[#f8faf6]'}`}>
            <p className={`text-[13px] ${isFailed ? 'text-[#9a392d]' : 'text-[#788179]'}`}>
              {isFailed
                ? 'Payment was not completed for this order. Please try placing it again.'
                : `This order has been ${order.paymentStatus.toLowerCase()}.`}
            </p>
          </div>
        )}

        {/* ── Admin note ── */}
        {order.adminNote && (
          <div className="flex items-start gap-3 rounded-2xl border border-[#e4d7aa] bg-[#fbf7e9] px-5 py-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-none text-[#8a6d27]">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a6d27]">
                Note from store
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#6c5b2c]">{order.adminNote}</p>
            </div>
          </div>
        )}

        {/* ── Order items ── */}
        <div className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
          <div className="border-b border-[#e8ece6] px-5 py-3 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#788179]">
              Items · {order.totalQuantity} {order.totalQuantity === 1 ? 'item' : 'items'}
            </p>
          </div>
          <ul className="divide-y divide-[#f0f3ee]">
            {order.items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <Link href={`/product/${item.productId}`} className="group relative h-16 w-14 flex-none overflow-hidden rounded-xl bg-[#edf0eb]">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.productTitle}
                      fill
                      sizes="56px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${item.productId}`} className="hover:text-[#3d6b24]">
                    <p className="text-[13px] font-semibold text-[#17211f]">{item.productTitle}</p>
                  </Link>
                  <p className="mt-0.5 text-[11px] text-[#788179]">
                    {item.variantTitle === 'Default Title' ? 'Standard' : item.variantTitle}
                    {' · '}Qty {item.quantity}
                  </p>
                </div>
                <p className="flex-none text-[13px] font-semibold text-[#17211f]">
                  ₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#e8ece6] px-5 py-4 sm:px-6">
            <div className="flex justify-between text-[14px] font-semibold text-[#17211f]">
              <span>Total</span>
              <span>₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* ── Buy again ── */}
        {(order.paymentStatus === 'DELIVERED' || order.paymentStatus === 'PAID') && (
          <div className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[13px] font-semibold text-[#17211f]">Want to order again?</p>
                <p className="mt-0.5 text-[11px] text-[#788179]">
                  Browse the same products and add them to your cart.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item) => (
                  <Link
                    key={item.variantId}
                    href={`/product/${item.productId}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#172c27] px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#27483d]"
                  >
                    {/* Cart icon */}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h2l.4 2m0 0L5 9h7l1.5-6H3.4zm1.6 9a1 1 0 102 0 1 1 0 00-2 0zm6 0a1 1 0 102 0 1 1 0 00-2 0z" />
                    </svg>
                    Buy {item.productTitle} again
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Need help ── */}
        {(() => {
          const orderDate = new Date(order.createdAt);
          const returnDeadline = new Date(orderDate);
          returnDeadline.setDate(returnDeadline.getDate() + 4);
          const now = new Date();
          const returnEligible = now <= returnDeadline;
          const deadlineStr = returnDeadline.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          });

          const showHelp = !['FAILED', 'PENDING', 'ACTIVE'].includes(order.paymentStatus);
          if (!showHelp) return null;

          return (
            <div className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
              <div className="border-b border-[#e8ece6] px-5 py-3 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#788179]">
                  Need help with your order?
                </p>
              </div>
              <div className="divide-y divide-[#f0f3ee]">

                {/* Product support */}
                <Link
                  href={`/contact?order=${order.orderId}&subject=Product+Support`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#f5f8ef] sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#edf3e7] text-[#3d6b24]">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#17211f]">Get product support</p>
                      <p className="mt-0.5 text-[11px] text-[#788179]">
                        Questions about your items? We&apos;re here to help.
                      </p>
                    </div>
                  </div>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-none text-[#c0c8be] transition-colors group-hover:text-[#3d6b24]">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </Link>

                {/* Return or replace */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${returnEligible ? 'bg-[#edf3e7] text-[#3d6b24]' : 'bg-[#f0f2ed] text-[#b0b8ae]'}`}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-[13px] font-semibold ${returnEligible ? 'text-[#17211f]' : 'text-[#b0b8ae]'}`}>
                        Return or replace items
                      </p>
                      <p className="mt-0.5 text-[11px]">
                        {returnEligible ? (
                          <span className="text-[#3d6b24]">
                            Eligible till <span className="font-semibold">{deadlineStr}</span>
                          </span>
                        ) : (
                          <span className="text-[#9a392d]">
                            Return window closed on <span className="font-semibold">{deadlineStr}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {returnEligible ? (
                    <Link
                      href={`/contact?order=${order.orderId}&subject=Return+or+Replace`}
                      className="flex-none rounded-full border border-[#c8ddb8] bg-[#edf3e7] px-3.5 py-1.5 text-[11px] font-semibold text-[#3d6b24] transition-colors hover:bg-[#c6f36b] hover:border-[#c6f36b] hover:text-[#17211f]"
                    >
                      Request return
                    </Link>
                  ) : (
                    <span className="flex-none rounded-full border border-[#e1e7de] px-3.5 py-1.5 text-[11px] font-medium text-[#b0b8ae] cursor-not-allowed">
                      Not eligible
                    </span>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

        {/* ── Delivery address ── */}
        {order.deliveryAddress && (
          <div className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
            <div className="border-b border-[#e8ece6] px-5 py-3 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#788179]">
                Shipping to
              </p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <p className="text-[13px] font-medium text-[#17211f]">{order.customerName || order.customerEmail}</p>
              <address className="mt-1 space-y-0.5 text-[12px] not-italic text-[#59645b]">
                <p>{order.deliveryAddress}</p>
                <p>
                  {order.deliveryCity}
                  {order.deliveryState ? `, ${order.deliveryState}` : ''}
                  {order.deliveryPincode ? ` — ${order.deliveryPincode}` : ''}
                </p>
              </address>
              <p className="mt-1 text-[12px] text-[#788179]">{order.customerPhone}</p>
              {order.altPhone && (
                <p className="text-[12px] text-[#788179]">Alt: {order.altPhone}</p>
              )}
              {order.deliveryNote && (
                <p className="mt-2 text-[11px] italic text-[#788179]">
                  &ldquo;{order.deliveryNote}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Order info ── */}
        <div className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
          <div className="border-b border-[#e8ece6] px-5 py-3 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#788179]">
              Order info
            </p>
          </div>
          <dl className="divide-y divide-[#f0f3ee]">
            {[
              { label: 'Order ID', value: order.orderId },
              { label: 'Date placed', value: formatDate(order.createdAt) },
              { label: 'Payment status', value: order.paymentStatus },
              { label: 'Email', value: order.customerEmail }
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4 px-5 py-3 sm:px-6">
                <dt className="text-[12px] text-[#788179]">{label}</dt>
                <dd className="text-right font-mono text-[11px] font-medium text-[#17211f] break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

      </div>
    </main>
  );
}
