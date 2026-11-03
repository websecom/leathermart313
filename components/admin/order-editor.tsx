'use client';

import type { Order } from 'lib/orders-storage';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const inp = 'w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] text-[#17211f] outline-none focus:border-[#9aad8e]';
const lbl = 'mb-1 block text-[11px] font-medium text-[#59645b]';

export default function OrderEditor({ order }: { order: Order }) {
  const router = useRouter();

  /* ── Edit mode state ── */
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    customerName:    order.customerName ?? '',
    customerPhone:   order.customerPhone ?? '',
    altPhone:        order.altPhone ?? '',
    deliveryAddress: order.deliveryAddress ?? '',
    deliveryCity:    order.deliveryCity ?? '',
    deliveryState:   order.deliveryState ?? '',
    deliveryPincode: order.deliveryPincode ?? '',
    deliveryNote:    order.deliveryNote ?? ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
    setMessage('');
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.orderId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:    form.customerName.trim()    || undefined,
          customerPhone:   form.customerPhone.trim()   || undefined,
          altPhone:        form.altPhone.trim()        || null,
          deliveryAddress: form.deliveryAddress.trim() || undefined,
          deliveryCity:    form.deliveryCity.trim()    || undefined,
          deliveryState:   form.deliveryState.trim()   || undefined,
          deliveryPincode: form.deliveryPincode.trim() || undefined,
          deliveryNote:    form.deliveryNote.trim()    || null
        })
      });
      const data = (await res.json()) as { updated?: boolean; error?: string };
      if (!res.ok || !data.updated) {
        setError(data.error ?? 'Could not save changes.');
        return;
      }
      setMessage('Order details updated.');
      setEditOpen(false);
      router.refresh();
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete order ${order.orderId}?\n\nThis cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.orderId)}`, {
        method: 'DELETE'
      });
      const data = (await res.json()) as { deleted?: boolean; error?: string };
      if (!res.ok || !data.deleted) {
        alert(data.error ?? 'Could not delete order.');
        return;
      }
      router.push('/admin/orders');
    } catch {
      alert('Server error.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Action buttons ── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setEditOpen((v) => !v); setError(''); setMessage(''); }}
          className="flex-1 rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#334239] transition-colors hover:border-[#9aad8e] hover:bg-[#f2f5f0]"
        >
          {editOpen ? '✕ Cancel editing' : '✎ Edit order details'}
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="rounded-lg border border-[#f0c9c4] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#a33e30] transition-colors hover:bg-[#fff1ed] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? '…' : '🗑 Delete'}
        </button>
      </div>

      {/* ── Edit form ── */}
      {editOpen && (
        <form
          onSubmit={saveDetails}
          className="overflow-hidden rounded-2xl border border-[#172c27]/20 bg-[#fbfcfa]"
        >
          <div className="border-b border-[#e8ece6] px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#607b4a]">
              Edit order details
            </p>
          </div>
          <div className="space-y-5 p-5">

            {/* Customer */}
            <div>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#788179]">
                Customer info
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={lbl}>Full name</label>
                  <input type="text" value={form.customerName}
                    onChange={(e) => set('customerName', e.target.value)}
                    className={inp} />
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input type="tel" value={form.customerPhone}
                    onChange={(e) => set('customerPhone', e.target.value)}
                    className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Alternate phone</label>
                  <input type="tel" value={form.altPhone}
                    onChange={(e) => set('altPhone', e.target.value)}
                    placeholder="Optional" className={inp} />
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#788179]">
                Delivery address
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={lbl}>Street address</label>
                  <textarea rows={2} value={form.deliveryAddress}
                    onChange={(e) => set('deliveryAddress', e.target.value)}
                    className={`${inp} resize-none`} />
                </div>
                <div>
                  <label className={lbl}>City</label>
                  <input type="text" value={form.deliveryCity}
                    onChange={(e) => set('deliveryCity', e.target.value)}
                    className={inp} />
                </div>
                <div>
                  <label className={lbl}>PIN code</label>
                  <input type="text" inputMode="numeric" maxLength={6}
                    value={form.deliveryPincode}
                    onChange={(e) => set('deliveryPincode', e.target.value.replace(/\D/g, ''))}
                    className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>State</label>
                  <input type="text" value={form.deliveryState}
                    onChange={(e) => set('deliveryState', e.target.value)}
                    className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Delivery instructions</label>
                  <textarea rows={2} value={form.deliveryNote}
                    onChange={(e) => set('deliveryNote', e.target.value)}
                    placeholder="Optional" className={`${inp} resize-none`} />
                </div>
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <p className="rounded-lg border border-[#f0c9c4] bg-[#fff8f7] px-3 py-2 text-[12px] text-[#9a392d]">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-lg border border-[#c8ddb8] bg-[#edf3e7] px-3 py-2 text-[12px] text-[#304a2a]">
                ✓ {message}
              </p>
            )}

            {/* Save */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#172c27] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#27483d] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-full border border-[#dce3da] px-5 py-2.5 text-[12px] font-medium text-[#59645b] hover:bg-[#f2f5f0]"
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
