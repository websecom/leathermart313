'use client';

import type { Coupon, ShippingSettings } from 'lib/coupons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const inp = 'w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2 text-[12px] text-[#17211f] outline-none focus:border-[#9aad8e]';
const lbl = 'mb-1 block text-[11px] font-medium text-[#59645b]';

type NewCoupon = Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>;

const EMPTY: NewCoupon = {
  code: '', type: 'percent', value: 10, minOrderAmount: 0,
  maxUses: null, active: true, expiresAt: null, description: ''
};

/* ── Single coupon row with inline edit ── */
function CouponRow({
  coupon,
  onUpdate,
  onDelete
}: {
  coupon: Coupon;
  onUpdate: (id: number, data: Partial<NewCoupon>) => Promise<void>;
  onDelete: (id: number, code: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<NewCoupon>({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount,
    maxUses: coupon.maxUses,
    active: coupon.active,
    expiresAt: coupon.expiresAt,
    description: coupon.description
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    await onUpdate(coupon.id, draft);
    setSaving(false);
    setEditing(false);
  }

  async function remove() {
    setDeleting(true);
    await onDelete(coupon.id, coupon.code);
    setDeleting(false);
  }

  const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
  const usagePct = coupon.maxUses ? Math.round((coupon.usedCount / coupon.maxUses) * 100) : null;

  if (editing) {
    return (
      <div className="rounded-xl border border-[#172c27]/20 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[#17211f]">
            Editing <span className="font-mono">{coupon.code}</span>
          </p>
          <button type="button" onClick={() => setEditing(false)}
            className="text-[11px] text-[#788179] hover:text-[#9a392d]">
            Cancel
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={lbl}>Code</label>
            <input type="text" value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
              className={`${inp} font-mono uppercase`} />
          </div>
          <div>
            <label className={lbl}>Description</label>
            <input type="text" value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className={inp} />
          </div>
          <div>
            <label className={lbl}>Type</label>
            <select value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as 'percent' | 'amount' }))}
              className={inp}>
              <option value="percent">Percentage off (%)</option>
              <option value="amount">Fixed amount off (₹)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>{draft.type === 'percent' ? 'Discount (%)' : 'Discount (₹)'}</label>
            <input type="number" min={0.01} step={0.01}
              max={draft.type === 'percent' ? 100 : undefined}
              value={draft.value}
              onChange={(e) => setDraft((d) => ({ ...d, value: Number(e.target.value) }))}
              className={inp} />
          </div>
          <div>
            <label className={lbl}>Min order amount (₹)</label>
            <input type="number" min={0} value={draft.minOrderAmount}
              onChange={(e) => setDraft((d) => ({ ...d, minOrderAmount: Number(e.target.value) }))}
              className={inp} />
          </div>
          <div>
            <label className={lbl}>Max uses</label>
            <input type="number" min={1}
              value={draft.maxUses ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, maxUses: e.target.value ? Number(e.target.value) : null }))}
              placeholder="Unlimited" className={inp} />
          </div>
          <div>
            <label className={lbl}>Expiry date</label>
            <input type="date"
              value={draft.expiresAt ? draft.expiresAt.split('T')[0] : ''}
              onChange={(e) => setDraft((d) => ({ ...d, expiresAt: e.target.value ? `${e.target.value}T23:59:59Z` : null }))}
              className={inp} />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input type="checkbox" id={`active-${coupon.id}`} checked={draft.active}
              onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              className="h-4 w-4 rounded accent-[#172c27]" />
            <label htmlFor={`active-${coupon.id}`} className="text-[12px] font-medium text-[#59645b]">
              Active
            </label>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={() => void save()} disabled={saving}
            className="rounded-full bg-[#172c27] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#27483d] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => setEditing(false)}
            className="rounded-full border border-[#dce3da] px-4 py-2 text-[12px] font-medium text-[#59645b] hover:bg-[#f2f5f0]">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-white px-4 py-3.5 transition-colors ${coupon.active && !isExpired ? 'border-[#e1e7de]' : 'border-[#f0f2ed] opacity-70'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left: info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[14px] font-bold text-[#17211f]">{coupon.code}</span>
            {coupon.active && !isExpired ? (
              <span className="rounded-full bg-[#edf3e7] px-2 py-0.5 text-[9px] font-bold uppercase text-[#3d6b24]">Active</span>
            ) : isExpired ? (
              <span className="rounded-full bg-[#fbefec] px-2 py-0.5 text-[9px] font-bold uppercase text-[#9a392d]">Expired</span>
            ) : (
              <span className="rounded-full bg-[#f0f2ed] px-2 py-0.5 text-[9px] font-bold uppercase text-[#788179]">Inactive</span>
            )}
            <span className="rounded-full bg-[#f0f7e8] px-2.5 py-0.5 text-[10px] font-semibold text-[#3d6b24]">
              {coupon.type === 'percent' ? `${coupon.value}% off` : `₹${coupon.value} off`}
            </span>
            {coupon.minOrderAmount > 0 && (
              <span className="text-[10px] text-[#788179]">Min ₹{coupon.minOrderAmount}</span>
            )}
          </div>

          <p className="mt-1 text-[11px] text-[#788179]">
            {coupon.description || <span className="italic">No description</span>}
          </p>

          {/* Usage bar */}
          <div className="mt-2 flex items-center gap-2">
            {coupon.maxUses !== null ? (
              <>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e8d9c4]">
                  <div
                    className="h-full rounded-full bg-[#172c27]"
                    style={{ width: `${Math.min(usagePct ?? 0, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#788179]">
                  {coupon.usedCount}/{coupon.maxUses} used
                </span>
              </>
            ) : (
              <span className="text-[10px] text-[#788179]">{coupon.usedCount} uses · unlimited</span>
            )}
            {coupon.expiresAt && (
              <span className={`text-[10px] ${isExpired ? 'text-[#9a392d]' : 'text-[#788179]'}`}>
                · {isExpired ? 'Expired' : 'Expires'} {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-none items-center gap-1.5">
          <button type="button" onClick={() => setEditing(true)}
            className="rounded-lg border border-[#dce3da] px-3 py-1.5 text-[11px] font-medium text-[#59645b] transition-colors hover:border-[#9aad8e] hover:bg-[#f2f5f0]">
            Edit
          </button>
          <button type="button"
            onClick={() => void onUpdate(coupon.id, { active: !coupon.active })}
            className="rounded-lg border border-[#dce3da] px-3 py-1.5 text-[11px] font-medium text-[#59645b] transition-colors hover:bg-[#f2f5f0]">
            {coupon.active ? 'Disable' : 'Enable'}
          </button>
          <button type="button" onClick={() => void remove()} disabled={deleting}
            className="rounded-lg border border-[#f0c9c4] px-3 py-1.5 text-[11px] font-medium text-[#a33e30] transition-colors hover:bg-[#fff1ed] disabled:opacity-50">
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function CouponManager({
  initialCoupons,
  initialShipping
}: {
  initialCoupons: Coupon[];
  initialShipping: ShippingSettings;
}) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [shipping, setShipping] = useState(initialShipping);
  const [newCoupon, setNewCoupon] = useState<NewCoupon>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /* ── Create coupon ── */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCoupon.code.trim()) { setError('Enter a coupon code.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      });
      const data = (await res.json()) as { error?: string; created?: boolean };
      if (!res.ok || !data.created) { setError(data.error ?? 'Could not create coupon.'); return; }
      setMessage(`Coupon "${newCoupon.code.toUpperCase()}" created.`);
      setNewCoupon(EMPTY);
      router.refresh();
    } catch { setError('Server error.'); } finally { setSaving(false); }
  }

  /* ── Update coupon (inline edit or toggle) ── */
  async function handleUpdate(id: number, data: Partial<NewCoupon>) {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, ...data } : c));
    } catch { /* ignore */ }
  }

  /* ── Delete coupon ── */
  async function handleDelete(id: number, code: string) {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  /* ── Save shipping ── */
  async function handleSaveShipping(e: React.FormEvent) {
    e.preventDefault();
    setSavingShipping(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipping)
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok || !data.saved) { setError(data.error ?? 'Could not save.'); return; }
      setMessage('Shipping settings saved.');
      router.refresh();
    } catch { setError('Server error.'); } finally { setSavingShipping(false); }
  }

  const activeCoupons = coupons.filter((c) => c.active);
  const inactiveCoupons = coupons.filter((c) => !c.active);

  return (
    <div className="space-y-6">

      {/* ── Shipping ── */}
      <section className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
        <div className="border-b border-[#e8ece6] px-5 py-4 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">Shipping</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">Shipping charges</h2>
          <p className="mt-1 text-[12px] text-[#788179]">
            Set when orders qualify for free shipping and the charge for orders below the threshold.
          </p>
        </div>
        <form onSubmit={handleSaveShipping} className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Free shipping above (₹)</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#8a928b]">₹</span>
                <input type="number" min={0} step={1} value={shipping.freeAbove}
                  onChange={(e) => setShipping((s) => ({ ...s, freeAbove: Number(e.target.value) }))}
                  className={`${inp} pl-7`} />
              </div>
              <p className="mt-1 text-[10px] text-[#8a928b]">
                Orders at or above this subtotal get free shipping. Set 0 for always free.
              </p>
            </div>
            <div>
              <label className={lbl}>Standard shipping charge (₹)</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#8a928b]">₹</span>
                <input type="number" min={0} step={1} value={shipping.standardCharge}
                  onChange={(e) => setShipping((s) => ({ ...s, standardCharge: Number(e.target.value) }))}
                  className={`${inp} pl-7`} />
              </div>
              <p className="mt-1 text-[10px] text-[#8a928b]">
                Applied when order total is below the free threshold.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 rounded-xl bg-[#f2f5f0] px-4 py-3 text-[11px] text-[#59645b]">
            {shipping.standardCharge === 0
              ? `All orders get free shipping.`
              : shipping.freeAbove === 0
                ? `All orders pay ₹${shipping.standardCharge} shipping.`
                : `Orders below ₹${shipping.freeAbove} pay ₹${shipping.standardCharge} shipping · orders above ₹${shipping.freeAbove} get free shipping.`
            }
          </div>

          {message && <p className="mt-3 text-[12px] text-[#526c3a]">✓ {message}</p>}
          {error && <p className="mt-3 text-[12px] text-[#9a392d]">{error}</p>}

          <button type="submit" disabled={savingShipping}
            className="mt-4 rounded-full bg-[#172c27] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#27483d] disabled:opacity-50">
            {savingShipping ? 'Saving…' : 'Save shipping settings'}
          </button>
        </form>
      </section>

      {/* ── Create coupon ── */}
      <section className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
        <div className="border-b border-[#e8ece6] px-5 py-4 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">New coupon</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">Create coupon code</h2>
        </div>
        <form onSubmit={handleCreate} className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Coupon code <span className="text-red-500">*</span></label>
              <input type="text" value={newCoupon.code}
                onChange={(e) => setNewCoupon((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20" className={`${inp} font-mono uppercase`} required />
              <p className="mt-1 text-[10px] text-[#8a928b]">Uppercase letters and numbers only</p>
            </div>
            <div>
              <label className={lbl}>Description</label>
              <input type="text" value={newCoupon.description}
                onChange={(e) => setNewCoupon((c) => ({ ...c, description: e.target.value }))}
                placeholder="e.g. Summer sale 20% off" className={inp} />
            </div>
            <div>
              <label className={lbl}>Discount type</label>
              <select value={newCoupon.type}
                onChange={(e) => setNewCoupon((c) => ({ ...c, type: e.target.value as 'percent' | 'amount' }))}
                className={inp}>
                <option value="percent">Percentage off (%)</option>
                <option value="amount">Fixed amount off (₹)</option>
              </select>
            </div>
            <div>
              <label className={lbl}>
                {newCoupon.type === 'percent' ? 'Discount (%)' : 'Discount amount (₹)'} <span className="text-red-500">*</span>
              </label>
              <input type="number" min={0.01} step={newCoupon.type === 'percent' ? 1 : 0.01}
                max={newCoupon.type === 'percent' ? 100 : undefined}
                value={newCoupon.value}
                onChange={(e) => setNewCoupon((c) => ({ ...c, value: Number(e.target.value) }))}
                className={inp} required />
            </div>
            <div>
              <label className={lbl}>Minimum order amount (₹)</label>
              <input type="number" min={0} step={1} value={newCoupon.minOrderAmount}
                onChange={(e) => setNewCoupon((c) => ({ ...c, minOrderAmount: Number(e.target.value) }))}
                className={inp} />
              <p className="mt-1 text-[10px] text-[#8a928b]">0 = no minimum</p>
            </div>
            <div>
              <label className={lbl}>Max uses total</label>
              <input type="number" min={1} step={1}
                value={newCoupon.maxUses ?? ''}
                onChange={(e) => setNewCoupon((c) => ({ ...c, maxUses: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Unlimited" className={inp} />
            </div>
            <div>
              <label className={lbl}>Expiry date</label>
              <input type="date"
                value={newCoupon.expiresAt ? newCoupon.expiresAt.split('T')[0] : ''}
                onChange={(e) => setNewCoupon((c) => ({ ...c, expiresAt: e.target.value ? `${e.target.value}T23:59:59Z` : null }))}
                className={inp} />
              <p className="mt-1 text-[10px] text-[#8a928b]">Leave blank for no expiry</p>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="new-active" checked={newCoupon.active}
                onChange={(e) => setNewCoupon((c) => ({ ...c, active: e.target.checked }))}
                className="h-4 w-4 rounded accent-[#172c27]" />
              <label htmlFor="new-active" className="text-[12px] font-medium text-[#59645b]">
                Active immediately
              </label>
            </div>
          </div>

          {/* Live preview */}
          {newCoupon.code && newCoupon.value > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#c8ddb8] bg-[#edf3e7] px-4 py-3">
              <span className="font-mono text-[13px] font-bold text-[#172c27]">{newCoupon.code}</span>
              <span className="text-[12px] text-[#3d6b24]">
                {newCoupon.type === 'percent'
                  ? `${newCoupon.value}% discount`
                  : `₹${newCoupon.value} off`}
              </span>
              {newCoupon.minOrderAmount > 0 && (
                <span className="text-[11px] text-[#68736b]">· Min ₹{newCoupon.minOrderAmount}</span>
              )}
              {newCoupon.maxUses && (
                <span className="text-[11px] text-[#68736b]">· {newCoupon.maxUses} uses</span>
              )}
              {!newCoupon.active && (
                <span className="ml-auto rounded-full bg-[#f0f2ed] px-2 py-0.5 text-[9px] font-bold uppercase text-[#788179]">
                  Draft
                </span>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-[12px] text-[#9a392d]">{error}</p>}
          {message && <p className="mt-3 text-[12px] text-[#526c3a]">✓ {message}</p>}

          <button type="submit" disabled={saving}
            className="mt-4 rounded-full bg-[#172c27] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#27483d] disabled:opacity-50">
            {saving ? 'Creating…' : 'Create coupon'}
          </button>
        </form>
      </section>

      {/* ── Existing coupons ── */}
      <section className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
        <div className="border-b border-[#e8ece6] px-5 py-4 sm:px-6">
          <h2 className="text-[15px] font-semibold text-[#17211f]">
            All coupons
            <span className="ml-2 text-[12px] font-normal text-[#788179]">
              {coupons.length} total · {activeCoupons.length} active
            </span>
          </h2>
        </div>
        <div className="p-5 sm:p-6">
          {coupons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d0daca] bg-[#f8faf6] px-8 py-10 text-center">
              <p className="text-[14px] font-semibold text-[#17211f]">No coupons yet</p>
              <p className="mt-1 text-[12px] text-[#68736b]">Create your first coupon code above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active first */}
              {activeCoupons.length > 0 && (
                <div className="space-y-2">
                  {activeCoupons.map((c) => (
                    <CouponRow key={c.id} coupon={c} onUpdate={handleUpdate} onDelete={handleDelete} />
                  ))}
                </div>
              )}
              {/* Inactive */}
              {inactiveCoupons.length > 0 && (
                <>
                  {activeCoupons.length > 0 && (
                    <p className="pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b0b8ae]">
                      Inactive / expired
                    </p>
                  )}
                  <div className="space-y-2">
                    {inactiveCoupons.map((c) => (
                      <CouponRow key={c.id} coupon={c} onUpdate={handleUpdate} onDelete={handleDelete} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
