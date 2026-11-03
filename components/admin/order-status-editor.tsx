'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'PENDING',    label: 'Pending',    color: 'bg-[#fbf7e9] text-[#8a6d27]' },
  { value: 'ACTIVE',     label: 'Active',     color: 'bg-[#fbf7e9] text-[#8a6d27]' },
  { value: 'PAID',       label: 'Paid',       color: 'bg-[#edf3e7] text-[#526c3a]' },
  { value: 'PREPARING',  label: 'Preparing',  color: 'bg-[#e8f0fb] text-[#2d5096]' },
  { value: 'DISPATCHED', label: 'Dispatched', color: 'bg-[#e8f0fb] text-[#2d5096]' },
  { value: 'DELIVERED',  label: 'Delivered',  color: 'bg-[#edf3e7] text-[#304a2a]' },
  { value: 'FAILED',     label: 'Failed',     color: 'bg-[#fbefec] text-[#9a392d]' },
  { value: 'REFUNDED',   label: 'Refunded',   color: 'bg-[#f0f2ed] text-[#788179]' },
  { value: 'CANCELLED',  label: 'Cancelled',  color: 'bg-[#f0f2ed] text-[#788179]' }
] as const;

type Props = {
  orderId: string;
  currentStatus: string;
  currentNote: string | null;
};

export default function OrderStatusEditor({ orderId, currentStatus, currentNote }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentNote ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty = status !== currentStatus || note !== (currentNote ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || saving) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: status,
          adminNote: note.trim() || null
        })
      });

      const json = (await res.json()) as { updated?: boolean; error?: string };

      if (!res.ok || !json.updated) {
        throw new Error(json.error ?? 'Could not update the order.');
      }

      setMessage('Order updated successfully.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#e1e7de] bg-[#fbfcfa] p-5">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#788179]">
        Update order
      </h3>
      <p className="mt-1 text-[11px] text-[#8a928b]">
        Manually override status or add an internal note.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {/* Status selector */}
        <div>
          <label
            htmlFor="order-status"
            className="mb-1.5 block text-[11px] font-medium text-[#59645b]"
          >
            Payment status
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  status === opt.value
                    ? `${opt.color} ring-2 ring-offset-1 ring-current`
                    : 'bg-[#f0f2ed] text-[#788179] hover:bg-[#e6e9e3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note textarea */}
        <div>
          <label
            htmlFor="admin-note"
            className="mb-1.5 block text-[11px] font-medium text-[#59645b]"
          >
            Admin note{' '}
            <span className="font-normal text-[#8a928b]">(optional · visible to customer)</span>
          </label>
          <textarea
            id="admin-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Refunded via bank transfer on 22 Oct…"
            className="w-full resize-y rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[12px] leading-5 text-[#17211f] placeholder:text-[#b0b8ae] outline-none focus:border-[#9aad8e]"
          />
          <p className="mt-1 text-right text-[10px] text-[#8a928b]">{note.length}/500</p>
        </div>

        {/* Feedback */}
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-lg border border-[#c6d9b2] bg-[#edf3e7] px-3 py-2 text-[12px] text-[#526c3a]">
            {message}
          </p>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={!isDirty || saving}
          className="w-full rounded-full bg-[#172c27] px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
