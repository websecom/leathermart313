import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrdersByEmail, isOrdersDatabaseConfigured, type Order } from 'lib/orders-storage';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My Orders',
  description: 'View your order history.'
};

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function OrderRow({ order }: { order: Order }) {
  const { cls, label } = STATUS_MAP[order.paymentStatus]
    ?? { cls: 'bg-[#f0f2ed] text-[#788179]', label: order.paymentStatus };

  return (
    <Link
      href={`/orders/${order.orderId}`}
      className="group flex items-center gap-4 rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-4 transition-all hover:border-[#9aad8e] hover:shadow-md sm:p-5"
    >
      {/* Thumbnail strip — first 3 items */}
      <div className="flex flex-none -space-x-3">
        {order.items.slice(0, 3).map((item, i) => (
          <div
            key={item.variantId}
            className="relative h-14 w-12 overflow-hidden rounded-xl border-2 border-white bg-[#edf0eb]"
            style={{ zIndex: 3 - i }}
          >
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.productTitle}
                fill
                sizes="48px"
                className="object-cover"
              />
            )}
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="relative flex h-14 w-12 items-center justify-center rounded-xl border-2 border-white bg-[#e8ece6] text-[10px] font-bold text-[#68736b]" style={{ zIndex: 0 }}>
            +{order.items.length - 3}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${cls}`}>
            {label}
          </span>
          {order.adminNote && (
            <span className="rounded-full bg-[#fbf7e9] px-2 py-0.5 text-[9px] font-medium text-[#8a6d27]">
              Note from store
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] font-semibold text-[#17211f]">
          {order.totalQuantity} {order.totalQuantity === 1 ? 'item' : 'items'}
          {order.deliveryCity ? ` · ${order.deliveryCity}` : ''}
        </p>
        <p className="mt-0.5 text-[11px] text-[#788179]">
          {formatDate(order.createdAt)}
          <span className="mx-1.5 text-[#d0daca]">·</span>
          <span className="font-mono">{order.orderId.slice(-8)}</span>
        </p>
      </div>

      {/* Amount + arrow */}
      <div className="flex flex-none flex-col items-end gap-1">
        <p className="text-[14px] font-semibold text-[#17211f]">
          ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <span className="text-[12px] text-[#9aad8e] transition-transform duration-200 group-hover:translate-x-0.5">
          View →
        </span>
      </div>
    </Link>
  );
}

export default async function MyOrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/orders');

  const user = await currentUser();
  const email = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  const orders = email
    ? await getOrdersByEmail(email, userId ?? undefined)
    : [];
  const dbConfigured = isOrdersDatabaseConfigured();

  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

      {/* ── Header ── */}
      <div className="mb-8">
        <Link href="/" className="text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]">
          ← Continue shopping
        </Link>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">Account</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
              My orders
            </h1>
          </div>
          {orders.length > 0 && (
            <span className="rounded-full border border-[#e1e7de] px-3 py-1.5 text-[12px] text-[#68736b]">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          )}
        </div>
      </div>

      {/* ── No DB ── */}
      {!dbConfigured && (
        <div className="rounded-xl border border-[#e4d7aa] bg-[#fbf7e9] px-5 py-4 text-[13px] text-[#6c5b2c]">
          <span className="font-semibold">Order history is not yet available.</span>{' '}
          The store database is not connected.
        </div>
      )}

      {/* ── Empty ── */}
      {dbConfigured && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d0daca] bg-[#f8faf6] px-8 py-20 text-center">
          <span className="mb-4 text-5xl" aria-hidden="true">📦</span>
          <h2 className="text-[16px] font-semibold text-[#17211f]">No orders yet</h2>
          <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#68736b]">
            Orders placed with <span className="font-medium">{email}</span> will appear here.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex rounded-full bg-[#172c27] px-6 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d]"
          >
            Browse the collection
          </Link>
        </div>
      )}

      {/* ── Order list ── */}
      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}
