'use client';

import type { Order } from 'lib/orders-storage';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const inp = 'w-full rounded-lg border border-[#dce3d8] bg-white px-3 py-2.5 text-[13px] text-[#17211f] placeholder:text-[#b0b8ae] outline-none focus:border-[#172c27] focus:ring-1 focus:ring-[#172c27]/20';
const lbl = 'mb-1 block text-[11px] font-medium text-[#17211f]';

// Statuses where editing is no longer allowed
const LOCKED = new Set(['DISPATCHED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED']);

export default function UserAddressEditor({ order }: { order: Order }) {
  const router = useRouter();
  const isLocked = LOCKED.has(order.paymentStatus);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerPhone:   order.customerPhone ?? '',
    altPhone:        order.altPhone ?? '',
    deliveryAddress: order.deliveryAddress ?? '',
    deliveryCity:    order.deliveryCity ?? '',
    deliveryState:   order.deliveryState ?? '',
    deliveryPincode: order.deliveryPincode ?? '',
    deliveryNote:    order.deliveryNote ?? ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
    setSuccess('');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.orderId)}/address`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone:   form.customerPhone.trim() || undefined,
          altPhone:        form.altPhone.trim() || null,
          deliveryAddress: form.deliveryAddress.trim() || undefined,
          deliveryCity:    form.deliveryCity.trim() || undefined,
          deliveryState:   form.deliveryState.trim() || undefined,
          deliveryPincode: form.deliveryPincode.trim() || undefined,
          deliveryNote:    form.deliveryNote.trim() || null
        })
      });

      const data = (await res.json()) as { updated?: boolean; error?: string };

      if (!res.ok || !data.updated) {
        setError(data.error ?? 'Could not save changes.');
        return;
      }

      setSuccess('Address updated successfully.');
      setOpen(false);
      router.refresh();
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (isLocked) return null; // Don't show once dispatched/delivered

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[#e8ece6] px-5 py-3 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#788179]">
          Delivery details
        </p>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#dce3d8] bg-white px-3 py-1 text-[11px] font-semibold text-[#334239] transition-colors hover:border-[#9aad8e] hover:bg-[#f2f5f0]"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path d="M13.488 2.513a1.75 1.75 0 00-2.475 0L6.75 6.774a2.75 2.75 0 00-.596.892l-.79 2.111a.75.75 0 00.966.966l2.111-.79a2.75 2.75 0 00.892-.596l4.261-4.263a1.75 1.75 0 000-2.474l-.106-.107zM2.75 9A.75.75 0 002 9.75v3.5c0 .414.336.75.75.75h3.5a.75.75 0 000-1.5h-2.75V9.75A.75.75 0 002.75 9z" />
            </svg>
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setOpen(false); setError(''); setSuccess(''); }}
            className="text-[11px] text-[#788179] hover:text-[#9a392d]"
          >
            Cancel
          </button>
        )}
      </div>

      {/* ── Current address (read view) ── */}
      {!open && (
        <div className="px-5 py-4 sm:px-6">
          {order.deliveryAddress ? (
            <>
              <p className="text-[13px] font-medium text-[#17211f]">
                {order.customerName || order.customerEmail}
              </p>
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
              {success && (
                <p className="mt-2 text-[11px] text-[#3d6b24]">✓ {success}</p>
              )}
            </>
          ) : (
            <p className="text-[12px] text-[#788179]">No delivery address on file.</p>
          )}
          <p className="mt-3 text-[10px] text-[#b0b8ae]">
            You can update your address and instructions until the order is dispatched.
          </p>
        </div>
      )}

      {/* ── Edit form ── */}
      {open && (
        <form onSubmit={save} className="p-5 sm:p-6">
          <div className="space-y-4">

            {/* Contact */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#788179]">
                Contact
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => set('customerPhone', e.target.value)}
                    placeholder="9876543210"
                    required
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Alternate phone</label>
                  <input
                    type="tel"
                    value={form.altPhone}
                    onChange={(e) => set('altPhone', e.target.value)}
                    placeholder="Optional"
                    className={inp}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#788179]">
                Delivery address
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={lbl}>Street address <span className="text-red-500">*</span></label>
                  <textarea
                    rows={2}
                    value={form.deliveryAddress}
                    onChange={(e) => set('deliveryAddress', e.target.value)}
                    placeholder="House / flat no., street, locality"
                    required
                    className={`${inp} resize-none`}
                  />
                </div>
                <div>
                  <label className={lbl}>City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.deliveryCity}
                    onChange={(e) => set('deliveryCity', e.target.value)}
                    placeholder="Mumbai"
                    required
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>PIN code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.deliveryPincode}
                    onChange={(e) => set('deliveryPincode', e.target.value.replace(/\D/g, ''))}
                    placeholder="400001"
                    required
                    className={inp}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>State <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.deliveryState}
                    onChange={(e) => set('deliveryState', e.target.value)}
                    placeholder="Maharashtra"
                    required
                    className={inp}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>
                    Delivery instructions
                    <span className="ml-1 text-[10px] font-normal text-[#788179]">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.deliveryNote}
                    onChange={(e) => set('deliveryNote', e.target.value)}
                    placeholder="Leave at door, call before delivery, etc."
                    className={`${inp} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Error / success */}
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
                {error}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#172c27] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save address'}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(''); }}
                className="rounded-full border border-[#dce3d8] px-5 py-2.5 text-[12px] font-medium text-[#59645b] hover:bg-[#f2f5f0]"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
