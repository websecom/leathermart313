'use client';

import type { InvoiceSettings } from 'lib/invoice-settings';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

const input = 'w-full rounded-lg border border-[#dce3da] bg-white px-3 py-2.5 text-[13px] text-[#17211f] outline-none focus:border-[#9aad8e] focus:ring-1 focus:ring-[#9aad8e]/30';
const labelCls = 'mb-1.5 block text-[12px] font-medium text-[#59645b]';
const sectionCard = 'overflow-hidden rounded-2xl border border-[#e1e7de] bg-[#fbfcfa]';
const sectionHead = 'border-b border-[#e8ece6] px-5 py-4 sm:px-6';
const sectionBody = 'p-5 sm:p-6';

/* ── Image upload widget ── */
function ImageUploadField({
  label,
  hint,
  type,
  currentUrl,
  onUploaded,
  previewSize = 120
}: {
  label: string;
  hint: string;
  type: 'qr' | 'signature';
  currentUrl: string;
  onUploaded: (url: string) => void;
  previewSize?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);
      const res = await fetch('/api/admin/invoice-settings/upload', {
        method: 'POST',
        body: form
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Upload failed.');
        return;
      }
      onUploaded(data.url);
    } catch {
      setError('Upload failed. Check your connection.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className={labelCls}>{label}</p>
      <p className="mb-3 text-[11px] text-[#8a928b]">{hint}</p>

      <div className="flex flex-wrap items-start gap-4">
        {/* Preview */}
        <div
          className="flex items-center justify-center overflow-hidden rounded-xl border border-[#dce3da] bg-[#f8faf6]"
          style={{ width: previewSize, height: previewSize, flexShrink: 0 }}
        >
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt={label}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-[#c0c8be]">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="text-[9px] text-[#c0c8be]">No image</span>
            </div>
          )}
        </div>

        {/* Upload + URL */}
        <div className="min-w-0 flex-1 space-y-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-[#dce3da] bg-white px-4 py-2 text-[12px] font-medium text-[#334239] transition-colors hover:border-[#9aad8e] hover:bg-[#f2f5f0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : currentUrl ? 'Replace image' : '↑ Upload image'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = '';
              if (file) void handleFile(file);
            }}
          />
          <p className="text-[10px] text-[#8a928b]">Or paste a public image URL:</p>
          <input
            type="url"
            value={currentUrl}
            onChange={(e) => onUploaded(e.target.value)}
            placeholder="https://..."
            className={input}
          />
          {error && <p className="text-[11px] text-[#9a392d]">{error}</p>}
          {currentUrl && (
            <button
              type="button"
              onClick={() => onUploaded('')}
              className="text-[11px] text-[#788179] underline underline-offset-2 hover:text-[#9a392d]"
            >
              Remove image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvoiceSettingsForm({
  initialSettings
}: {
  initialSettings: InvoiceSettings;
}) {
  const router = useRouter();
  const [s, setS] = useState<InvoiceSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function update<K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    setMessage('');
    setError('');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/invoice-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok || !data.saved) {
        setError(data.error ?? 'Could not save settings.');
        return;
      }
      setMessage('Invoice settings saved. All future invoices will use these details.');
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">

      {/* ── Business & GST ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">Business info</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">Company & GST details</h2>
        </div>
        <div className={`${sectionBody} grid gap-4 sm:grid-cols-2`}>
          {([
            { key: 'businessName' as const,    label: 'Business name',    placeholder: 'Leather Mart 313', span: false },
            { key: 'gstin' as const,           label: 'GSTIN',            placeholder: '29AABCU9603R1ZX', hint: '15-character GST Identification Number', span: false },
            { key: 'pan' as const,             label: 'PAN',              placeholder: 'AABCU9603R', span: false },
            { key: 'businessPhone' as const,   label: 'Phone',            placeholder: '9999999999', span: false },
            { key: 'businessEmail' as const,   label: 'Email',            placeholder: 'info@example.com', span: false },
          ] as { key: keyof InvoiceSettings; label: string; placeholder?: string; hint?: string; span: boolean }[]).map(({ key, label, placeholder, hint }) => (
            <div key={key}>
              <label htmlFor={key} className={labelCls}>{label}</label>
              <input id={key} type="text" value={String(s[key])} onChange={(e) => update(key, e.target.value as InvoiceSettings[typeof key])} placeholder={placeholder} className={input} />
              {hint && <p className="mt-1 text-[10px] text-[#8a928b]">{hint}</p>}
            </div>
          ))}

          {/* ── Billing address fields ── */}
          <div className="sm:col-span-2">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#607b4a]">
              Billing address
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="businessAddress" className={labelCls}>
                  Street / locality
                </label>
                <textarea
                  id="businessAddress"
                  rows={2}
                  value={s.businessAddress}
                  onChange={(e) => update('businessAddress', e.target.value)}
                  placeholder="Shop No. 1, Leather Market"
                  className={`${input} resize-none`}
                />
              </div>
              <div>
                <label htmlFor="businessCity" className={labelCls}>City</label>
                <input
                  id="businessCity"
                  type="text"
                  value={s.businessCity}
                  onChange={(e) => update('businessCity', e.target.value)}
                  placeholder="Mumbai"
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="businessPincode" className={labelCls}>PIN code</label>
                <input
                  id="businessPincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={s.businessPincode}
                  onChange={(e) => update('businessPincode', e.target.value.replace(/\D/g, ''))}
                  placeholder="400001"
                  className={input}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="businessState" className={labelCls}>State</label>
                <input
                  id="businessState"
                  type="text"
                  value={s.businessState}
                  onChange={(e) => update('businessState', e.target.value)}
                  placeholder="Maharashtra"
                  className={input}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tax ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">Tax settings</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">GST & HSN configuration</h2>
        </div>
        <div className={`${sectionBody} grid gap-4 sm:grid-cols-2`}>
          <div>
            <label htmlFor="gstRate" className={labelCls}>GST rate (%)</label>
            <input id="gstRate" type="number" min={0} max={100} value={s.gstRate} onChange={(e) => update('gstRate', Number(e.target.value))} className={input} />
            <p className="mt-1 text-[10px] text-[#8a928b]">CGST and SGST are each half this rate.</p>
          </div>
          <div>
            <label htmlFor="hsnCode" className={labelCls}>HSN code</label>
            <input id="hsnCode" type="text" value={s.hsnCode} onChange={(e) => update('hsnCode', e.target.value)} placeholder="4202" className={input} />
            <p className="mt-1 text-[10px] text-[#8a928b]">Harmonised System of Nomenclature code.</p>
          </div>
        </div>
      </div>

      {/* ── Bank ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">Bank details</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">Payment bank account</h2>
        </div>
        <div className={`${sectionBody} grid gap-4 sm:grid-cols-2`}>
          {([
            { key: 'bankName' as const,    label: 'Bank name',      placeholder: 'YES Bank' },
            { key: 'bankAccount' as const, label: 'Account number', placeholder: '0123456789' },
            { key: 'bankIfsc' as const,    label: 'IFSC code',      placeholder: 'YESB0000123' },
            { key: 'bankBranch' as const,  label: 'Branch',         placeholder: 'Mumbai Main' },
          ] as { key: keyof InvoiceSettings; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label htmlFor={key} className={labelCls}>{label}</label>
              <input id={key} type="text" value={String(s[key])} onChange={(e) => update(key, e.target.value as InvoiceSettings[typeof key])} placeholder={placeholder} className={input} />
            </div>
          ))}
        </div>
      </div>

      {/* ── UPI ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">UPI payment</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">UPI ID & QR code</h2>
        </div>
        <div className={`${sectionBody} space-y-5`}>
          <div>
            <label htmlFor="upiId" className={labelCls}>UPI ID</label>
            <input
              id="upiId"
              type="text"
              value={s.upiId}
              onChange={(e) => update('upiId', e.target.value)}
              placeholder="yourname@upi"
              className={input}
            />
            <p className="mt-1 text-[10px] text-[#8a928b]">Displayed below the QR code on invoices.</p>
          </div>
          <ImageUploadField
            label="UPI QR code image"
            hint="Upload a QR code image generated from your UPI app or payment gateway. PNG or JPG, max 2 MB."
            type="qr"
            currentUrl={s.upiQrUrl}
            onUploaded={(url) => update('upiQrUrl', url)}
            previewSize={130}
          />
        </div>
      </div>

      {/* ── Signature ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">Authorised signatory</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">Signature image</h2>
        </div>
        <div className={sectionBody}>
          <ImageUploadField
            label="Signature image"
            hint="Upload a scanned or digital signature image on a white/transparent background. PNG recommended, max 2 MB."
            type="signature"
            currentUrl={s.signatureUrl}
            onUploaded={(url) => update('signatureUrl', url)}
            previewSize={160}
          />
        </div>
      </div>

      {/* ── Terms ── */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#607b4a]">Legal</p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[#17211f]">Terms & conditions</h2>
        </div>
        <div className={sectionBody}>
          <label htmlFor="terms" className={labelCls}>Terms shown on invoice</label>
          <textarea
            id="terms"
            rows={5}
            value={s.terms}
            onChange={(e) => update('terms', e.target.value)}
            className={`${input} resize-y`}
          />
          <p className="mt-1 text-[10px] text-[#8a928b]">One term per line. These print at the bottom of every invoice.</p>
        </div>
      </div>

      {/* ── Save bar ── */}
      <div className="sticky bottom-0 rounded-2xl border border-[#e1e7de] bg-white/95 px-5 py-4 shadow-[0_-4px_24px_rgba(23,44,39,0.08)] backdrop-blur-sm sm:px-6">
        {error && (
          <p role="alert" className="mb-3 rounded-lg border border-[#f0c9c4] bg-[#fff8f7] px-3 py-2.5 text-[12px] text-[#9a392d]">{error}</p>
        )}
        {message && (
          <p role="status" className="mb-3 rounded-lg border border-[#c8ddb8] bg-[#edf3e7] px-3 py-2.5 text-[12px] text-[#304a2a]">✓ {message}</p>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] text-[#788179]">
            GST: {s.gstin} · {s.gstRate}% · HSN: {s.hsnCode}
            {s.upiId ? ` · UPI: ${s.upiId}` : ''}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#172c27] px-6 py-3 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#27483d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save invoice settings'}
          </button>
        </div>
      </div>
    </form>
  );
}
