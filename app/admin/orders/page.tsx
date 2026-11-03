import { requireAdmin } from 'lib/admin-auth';
import { getOrders, getOrderStats, isOrdersDatabaseConfigured } from 'lib/orders-storage';
import Link from 'next/link';

export const runtime = 'nodejs';
export const metadata = {
  title: 'Orders',
  description: 'View customer orders and payment status.'
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${classes}`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function OrdersPage() {
  await requireAdmin();

  const databaseConfigured = isOrdersDatabaseConfigured();

  if (!databaseConfigured) {
    return (
      <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
          >
            ← Admin dashboard
          </Link>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            Customer orders
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
            Orders
          </h1>
        </div>
        <div className="rounded-xl border border-[#e4d7aa] bg-[#fbf7e9] px-4 py-6 text-center">
          <p className="text-[14px] font-medium text-[#17211f]">Supabase is not configured.</p>
          <p className="mt-2 text-[12px] text-[#68736b]">
            Add <code className="rounded bg-[#f2f5f0] px-1.5 py-0.5 text-[#4a6e2a]">SUPABASE_URL</code> and{' '}
            <code className="rounded bg-[#f2f5f0] px-1.5 py-0.5 text-[#4a6e2a]">SUPABASE_SERVICE_ROLE_KEY</code> to your
            environment and run the orders migration to start collecting order data.
          </p>
        </div>
      </main>
    );
  }

  const [orders, stats] = await Promise.all([getOrders(), getOrderStats()]);

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin"
            className="mb-4 inline-flex text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
          >
            ← Admin dashboard
          </Link>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            Customer orders
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
            Orders
          </h1>
          <p className="mt-2 text-[14px] text-[#68736b]">
            View customer orders placed through the Cashfree checkout.
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-4">
          <p className="text-[11px] text-[#788179]">Total orders</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#17211f]">
            {stats.totalOrders}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-4">
          <p className="text-[11px] text-[#607b4a]">Paid</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#304a2a]">
            {stats.paidOrders}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-4">
          <p className="text-[11px] text-[#788179]">Pending / active</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#17211f]">
            {stats.pendingOrders}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-4">
          <p className="text-[11px] text-[#607b4a]">Revenue (paid)</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#304a2a]">
            ₹{Number(stats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* ── Orders table ── */}
      {orders.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d0daca] bg-[#f8faf6] p-12 text-center">
          <span className="mb-4 text-5xl" aria-hidden="true">📦</span>
          <h2 className="text-[16px] font-semibold text-[#17211f]">No orders yet</h2>
          <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#68736b]">
            Orders will appear here once customers start checking out through the Cashfree payment flow.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
          {/* Desktop table */}
          <table className="hidden w-full sm:table">
            <thead>
              <tr className="border-b border-[#e8ece6] text-left">
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                  Order ID
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                  Customer
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                  Delivery
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                  Items
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                  Amount
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                  Status
                </th>
                <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0eb]">
              {orders.map((order) => (
                <tr
                  key={order.orderId}
                  className="transition-colors hover:bg-[#f2f5f0]"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className="font-mono text-[11px] font-medium text-[#526c3a] hover:underline"
                    >
                      {order.orderId}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[12px] font-medium text-[#17211f]">
                      {order.customerName || '—'}
                    </p>
                    <p className="text-[11px] text-[#788179]">{order.customerEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    {order.deliveryCity ? (
                      <p className="text-[12px] text-[#17211f]">
                        {order.deliveryCity}{order.deliveryState ? `, ${order.deliveryState}` : ''}
                      </p>
                    ) : (
                      <span className="text-[11px] text-[#b0b8ae]">—</span>
                    )}
                    {order.deliveryPincode && (
                      <p className="text-[10px] text-[#788179]">PIN {order.deliveryPincode}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[12px] text-[#59645b]">
                    {order.totalQuantity} {order.totalQuantity === 1 ? 'item' : 'items'}
                  </td>
                  <td className="px-5 py-4 text-[13px] font-semibold text-[#17211f]">
                    ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-5 py-4 text-[11px] text-[#788179]">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="divide-y divide-[#edf0eb] sm:hidden">
            {orders.map((order) => (
              <Link
                key={order.orderId}
                href={`/admin/orders/${order.orderId}`}
                className="block p-4 transition-colors hover:bg-[#f2f5f0]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-[11px] font-medium text-[#526c3a]">
                    {order.orderId}
                  </span>
                  <StatusBadge status={order.paymentStatus} />
                </div>
                <p className="mt-2 text-[12px] font-medium text-[#17211f]">
                  {order.customerName || order.customerEmail}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-[#788179]">
                    {order.totalQuantity} items · {formatDate(order.createdAt)}
                  </span>
                  <span className="text-[13px] font-semibold text-[#17211f]">
                    ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
