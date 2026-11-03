import OrderEditor from 'components/admin/order-editor';
import OrderStatusEditor from 'components/admin/order-status-editor';
import { requireAdmin } from 'lib/admin-auth';
import { getOrders } from 'lib/orders-storage';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const runtime = 'nodejs';
export const metadata = {
  title: 'Order detail',
  description: 'View a customer order.'
};

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === 'PAID';
  const isPending = status === 'PENDING' || status === 'ACTIVE';
  const isFailed = status === 'FAILED';

  const classes = isPaid
    ? 'bg-[#edf3e7] text-[#526c3a]'
    : isPending
      ? 'bg-[#fbf7e9] text-[#8a6d27]'
      : isFailed
        ? 'bg-[#fbefec] text-[#9a392d]'
        : 'bg-[#f0f2ed] text-[#788179]';

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${classes}`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function OrderDetailPage({
  params
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const orders = await getOrders();
  const order = orders.find((o) => o.orderId === params.id);

  if (!order) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-[960px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/admin/orders"
        className="mb-5 inline-flex text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
      >
        ← Back to orders
      </Link>

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            Order detail
          </p>
          <h1 className="mt-2 break-all font-mono text-xl font-semibold tracking-[-0.03em] text-[#17211f] sm:text-2xl">
            {order.orderId}
          </h1>
          <p className="mt-1 text-[12px] text-[#788179]">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.paymentStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* ── Items ── */}
        <section className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
          <div className="border-b border-[#e8ece6] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#17211f]">Items</h2>
            <p className="mt-1 text-[11px] text-[#788179]">
              {order.totalQuantity} {order.totalQuantity === 1 ? 'item' : 'items'} in this order
            </p>
          </div>
          <ul className="divide-y divide-[#edf0eb]">
            {order.items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-14 flex-none overflow-hidden rounded-lg bg-[#edf0eb]">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.productTitle}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#17211f]">
                    {item.productTitle}
                  </p>
                  <p className="mt-1 text-[11px] text-[#788179]">
                    {item.variantTitle === 'Default Title' ? 'Standard' : item.variantTitle}
                    {' · '}
                    Qty {item.quantity}
                  </p>
                </div>
                <p className="flex-none text-[13px] font-medium text-[#17211f]">
                  ₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-[#e8ece6] px-5 py-4 text-[13px]">
            <div className="flex justify-between text-[#68736b]">
              <span>Subtotal</span>
              <span>
                ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[#68736b]">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between border-t border-[#e1e7de] pt-2 text-[15px] font-semibold text-[#17211f]">
              <span>Total</span>
              <span>
                ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </section>

        {/* ── Customer info + editor ── */}
        <aside className="h-fit space-y-4">
          <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
              Customer
            </h3>
            <dl className="mt-3 space-y-2.5 text-[12px]">
              <div>
                <dt className="text-[#788179]">Name</dt>
                <dd className="font-medium text-[#17211f]">{order.customerName || '—'}</dd>
              </div>
              <div>
                <dt className="text-[#788179]">Email</dt>
                <dd className="font-medium text-[#17211f]">{order.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-[#788179]">Phone</dt>
                <dd className="font-medium text-[#17211f]">{order.customerPhone}</dd>
              </div>
              {order.altPhone && (
                <div>
                  <dt className="text-[#788179]">Alternate phone</dt>
                  <dd className="font-medium text-[#17211f]">{order.altPhone}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* ── Delivery address ── */}
          {order.deliveryAddress && (
            <div className="rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#607b4a]">
                Delivery address
              </h3>
              <address className="mt-3 space-y-1 text-[12px] not-italic text-[#334239]">
                <p className="font-medium">{order.deliveryAddress}</p>
                <p>{order.deliveryCity}{order.deliveryState ? `, ${order.deliveryState}` : ''}</p>
                {order.deliveryPincode && <p>PIN: {order.deliveryPincode}</p>}
              </address>
              {order.deliveryNote && (
                <div className="mt-3 rounded-lg border border-[#c8ddb8] bg-white/70 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#607b4a]">
                    Delivery instructions
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-[#334239]">{order.deliveryNote}</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
              Payment
            </h3>
            <dl className="mt-3 space-y-2.5 text-[12px]">
              <div>
                <dt className="text-[#788179]">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={order.paymentStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-[#788179]">Currency</dt>
                <dd className="font-medium text-[#17211f]">{order.currency}</dd>
              </div>
              {order.cfOrderStatus && (
                <div>
                  <dt className="text-[#788179]">Cashfree status</dt>
                  <dd className="font-medium text-[#17211f]">{order.cfOrderStatus}</dd>
                </div>
              )}
              <div>
                <dt className="text-[#788179]">Created</dt>
                <dd className="font-medium text-[#17211f]">{formatDate(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[#788179]">Last updated</dt>
                <dd className="font-medium text-[#17211f]">{formatDate(order.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* ── Admin note (read view) ── */}
          {order.adminNote && (
            <div className="rounded-2xl border border-[#e4d7aa] bg-[#fbf7e9] p-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8a6d27]">
                Admin note
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-[#6c5b2c]">
                {order.adminNote}
              </p>
            </div>
          )}

          {/* ── Status editor ── */}
          <OrderStatusEditor
            orderId={order.orderId}
            currentStatus={order.paymentStatus}
            currentNote={order.adminNote}
          />

          {/* ── Edit / Delete ── */}
          <OrderEditor order={order} />
        </aside>
      </div>
    </main>
  );
}
