import { requireAdmin } from 'lib/admin-auth';
import { getAllCoupons, getShippingSettings } from 'lib/coupons';
import CouponManager from 'components/admin/coupon-manager';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Coupons & Shipping',
  description: 'Manage coupon codes and shipping charges.'
};

export default async function CouponsPage() {
  await requireAdmin();

  const [coupons, shipping] = await Promise.all([
    getAllCoupons(),
    getShippingSettings()
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-[900px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* ── Header ── */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
        >
          ← Admin dashboard
        </Link>
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            Promotions
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
            Coupons & shipping
          </h1>
          <p className="mt-2 text-[14px] text-[#68736b]">
            Create and manage discount codes, set shipping thresholds and charges.
          </p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-4">
          <p className="text-[11px] text-[#788179]">Total coupons</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#17211f]">
            {coupons.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dce8c7] bg-[#f5f8ef] p-4">
          <p className="text-[11px] text-[#607b4a]">Active</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#304a2a]">
            {coupons.filter((c) => c.active).length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-4">
          <p className="text-[11px] text-[#788179]">Free ship above</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#17211f]">
            ₹{shipping.freeAbove}
          </p>
        </div>
      </div>

      <CouponManager initialCoupons={coupons} initialShipping={shipping} />
    </main>
  );
}
