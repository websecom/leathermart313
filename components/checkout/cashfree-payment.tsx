'use client';

/**
 * CashfreePayment — checkout form + payment
 *
 * Collects delivery details (required) and customer info,
 * then launches the Cashfree payment drop.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Cashfree?: (config: { mode: string }) => CashfreeInstance;
  }
}

type CashfreeInstance = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_top' | 'popup';
  }) => Promise<{ error?: { message: string }; redirect?: boolean; paymentDetails?: unknown }>;
};

const inputClass =
  'w-full rounded-lg border border-[#dce3d8] bg-white px-3 py-2.5 text-[13px] text-[#17211f] placeholder:text-[#b0b8ae] focus:border-[#172c27] focus:outline-none focus:ring-1 focus:ring-[#172c27]';

const labelClass = 'mb-1 block text-[11px] font-medium text-[#17211f]';

type CouponState = {
  code: string;
  applied: boolean;
  discountAmount: string;
  shippingAmount: string;
  total: string;
  message: string;
  error: string;
  loading: boolean;
};

type Props = {
  cartTotal: string;
  currencyCode: string;
  prefillEmail?: string;
  prefillName?: string;
};

export default function CashfreePayment({ cartTotal, prefillEmail = '', prefillName = '' }: Props) {
  /* ── Personal details ── */
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');

  /* ── Delivery address ── */
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  /* ── Coupon ── */
  const [coupon, setCoupon] = useState<CouponState>({
    code: '', applied: false, discountAmount: '0', shippingAmount: '0',
    total: cartTotal, message: '', error: '', loading: false
  });
  /* ── UI state ── */
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const cashfreeRef = useRef<CashfreeInstance | null>(null);

  /* ── Apply coupon ── */
  async function applyCoupon() {
    if (!coupon.code.trim()) return;
    setCoupon((c) => ({ ...c, loading: true, error: '', message: '' }));
    try {
      const res = await fetch('/api/checkout/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon.code.trim() })
      });
      const data = (await res.json()) as {
        error?: string; valid?: boolean;
        discountAmount?: string; shippingAmount?: string;
        total?: string; message?: string; code?: string;
      };
      if (!res.ok || !data.valid) {
        setCoupon((c) => ({ ...c, loading: false, error: data.error ?? 'Invalid coupon.', applied: false }));
        return;
      }
      setCoupon((c) => ({
        ...c, loading: false, applied: true,
        code: data.code ?? c.code,
        discountAmount: data.discountAmount ?? '0',
        shippingAmount: data.shippingAmount ?? '0',
        total: data.total ?? cartTotal,
        message: data.message ?? '',
        error: ''
      }));
    } catch {
      setCoupon((c) => ({ ...c, loading: false, error: 'Could not apply coupon.' }));
    }
  }

  function removeCoupon() {
    setCoupon({ code: '', applied: false, discountAmount: '0', shippingAmount: '0', total: cartTotal, message: '', error: '', loading: false });
  }

  useEffect(() => {
    const initInstance = () => {
      if (window.Cashfree) {
        const mode =
          process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
        cashfreeRef.current = window.Cashfree({ mode });
        setSdkReady(true);
      }
    };

    if (document.getElementById('cashfree-sdk')) {
      if (window.Cashfree) {
        initInstance();
      } else {
        const existing = document.getElementById('cashfree-sdk') as HTMLScriptElement;
        existing.addEventListener('load', initInstance, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'cashfree-sdk';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = initInstance;
    script.onerror = () =>
      setError('Failed to load payment SDK. Please refresh and try again.');
    document.body.appendChild(script);
  }, []);

  const handlePay = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!cashfreeRef.current) {
        setError('Payment SDK is still loading. Please wait a moment and try again.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/cashfree/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: name.trim(),
            customerEmail: email.trim(),
            customerPhone: phone.trim(),
            altPhone: altPhone.trim() || undefined,
            deliveryAddress: address.trim(),
            deliveryCity: city.trim(),
            deliveryState: state.trim(),
            deliveryPincode: pincode.trim(),
            deliveryNote: deliveryNote.trim() || undefined,
            couponCode: coupon.applied ? coupon.code : undefined
          })
        });

        const json = (await res.json()) as { paymentSessionId?: string; error?: string };

        if (!res.ok || !json.paymentSessionId) {
          throw new Error(json.error ?? 'Could not create payment order. Please try again.');
        }

        const result = await cashfreeRef.current.checkout({
          paymentSessionId: json.paymentSessionId,
          redirectTarget: '_self'
        });

        if (result?.error) {
          throw new Error(result.error.message ?? 'Payment was not completed.');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [name, email, phone, altPhone, address, city, state, pincode, deliveryNote, coupon.applied, coupon.code]
  );

  return (
    <form onSubmit={handlePay} noValidate className="space-y-5">

      {/* ── Personal details ── */}
      <div>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4a6e2a]">
          Personal details
        </h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="cf-name" className={labelClass}>Full name</label>
            <input
              id="cf-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cf-email" className={labelClass}>
              Email address <span className="text-red-500">*</span>
              {prefillEmail && (
                <span className="ml-1.5 text-[10px] font-normal text-[#526c3a]">· from your account</span>
              )}
            </label>
            <input
              id="cf-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={Boolean(prefillEmail)}
              placeholder="jane@example.com"
              className={`${inputClass} ${prefillEmail ? 'cursor-default bg-[#f2f5f0] text-[#59645b]' : ''}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cf-phone" className={labelClass}>
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="cf-phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cf-alt-phone" className={labelClass}>
                Alternate phone
              </label>
              <input
                id="cf-alt-phone"
                type="tel"
                autoComplete="tel"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery address ── */}
      <div>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4a6e2a]">
          Delivery address
        </h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="cf-address" className={labelClass}>
              Street address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cf-address"
              autoComplete="street-address"
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House / flat no., street, locality"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cf-city" className={labelClass}>
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="cf-city"
                type="text"
                autoComplete="address-level2"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cf-pincode" className={labelClass}>
                PIN code <span className="text-red-500">*</span>
              </label>
              <input
                id="cf-pincode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="400001"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="cf-state" className={labelClass}>
              State <span className="text-red-500">*</span>
            </label>
            <input
              id="cf-state"
              type="text"
              autoComplete="address-level1"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Maharashtra"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cf-note" className={labelClass}>
              Delivery instructions
              <span className="ml-1.5 text-[10px] font-normal text-[#8b948c]">(optional)</span>
            </label>
            <textarea
              id="cf-note"
              rows={2}
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Leave at door, call before delivery, etc."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      )}

      {/* ── Coupon code ── */}
      <div>
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4a6e2a]">
          Coupon code
        </h3>
        {coupon.applied ? (
          <div className="flex items-center justify-between rounded-lg border border-[#c8ddb8] bg-[#edf3e7] px-3 py-2.5">
            <div>
              <p className="text-[12px] font-semibold text-[#3d6b24]">✓ {coupon.code}</p>
              <p className="text-[11px] text-[#526c3a]">{coupon.message}</p>
            </div>
            <button type="button" onClick={removeCoupon}
              className="text-[11px] text-[#788179] underline hover:text-[#9a392d]">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={coupon.code}
              onChange={(e) => setCoupon((c) => ({ ...c, code: e.target.value.toUpperCase(), error: '' }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void applyCoupon(); } }}
              placeholder="Enter coupon code"
              className={`${inputClass} flex-1 uppercase`}
              disabled={coupon.loading}
            />
            <button
              type="button"
              onClick={() => void applyCoupon()}
              disabled={coupon.loading || !coupon.code.trim()}
              className="rounded-lg border border-[#dce3d8] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#334239] transition-colors hover:border-[#9aad8e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {coupon.loading ? '…' : 'Apply'}
            </button>
          </div>
        )}
        {coupon.error && (
          <p className="mt-1.5 text-[11px] text-[#9a392d]">{coupon.error}</p>
        )}
      </div>

      {/* ── Order total ── */}
      <div className="rounded-lg bg-[#f3f6f1] px-4 py-3 text-[12px] text-[#68736b]">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{Number(cartTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {coupon.applied && Number(coupon.discountAmount) > 0 && (
            <div className="flex justify-between text-[#3d6b24]">
              <span>Discount ({coupon.code})</span>
              <span>− ₹{Number(coupon.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {coupon.applied
                ? Number(coupon.shippingAmount) === 0
                  ? 'Free'
                  : `₹${Number(coupon.shippingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : Number(cartTotal) >= 100 ? 'Free' : 'Calculated'}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#dce3d8] pt-1.5 text-[14px] font-bold text-[#17211f]">
            <span>Total to pay</span>
            <span>
              ₹{Number(coupon.applied ? coupon.total : cartTotal)
                .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[10px]">All prices are in INR (₹).</p>
      </div>

      {/* ── Pay button ── */}
      <button
        type="submit"
        disabled={loading || !sdkReady}
        aria-busy={loading}
        className="w-full rounded-full bg-[#172c27] px-5 py-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d] focus:outline-none focus:ring-2 focus:ring-[#172c27] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!sdkReady ? 'Loading payment…' : loading ? 'Redirecting to payment…' :
          `Pay ₹${Number(coupon.applied ? coupon.total : cartTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
      </button>

      <div className="flex items-center justify-center gap-2 text-[10px] text-[#8b948c]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span>Secured by Cashfree Payments</span>
      </div>
    </form>
  );
}
