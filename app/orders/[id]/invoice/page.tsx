import { auth, currentUser } from '@clerk/nextjs/server';
import InvoicePrintButton from 'components/invoice-print-button';
import { getInvoiceSettings } from 'lib/invoice-settings';
import { getOrdersByEmail, type Order } from 'lib/orders-storage';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Tax Invoice — ${params.id}` };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function numberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (amount === 0) return 'Zero';

  function convert(n: number): string {
    if (n < 20) return ones[n] ?? '';
    if (n < 100) return (tens[Math.floor(n / 10)] ?? '') + (n % 10 ? ' ' + (ones[n % 10] ?? '') : '');
    if (n < 1000) return (ones[Math.floor(n / 100)] ?? '') + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = convert(rupees) + ' Rupees';
  if (paise > 0) words += ' and ' + convert(paise) + ' Paise';
  return words + ' Only';
}

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/orders/${params.id}/invoice`);

  const user = await currentUser();
  const email = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  const [orders, settings] = await Promise.all([
    email ? getOrdersByEmail(email, userId ?? undefined) : Promise.resolve([]),
    getInvoiceSettings()
  ]);
  const order: Order | undefined = (orders as Order[]).find((o) => o.orderId === params.id);

  if (!order) notFound();
  if (order.paymentStatus !== 'DELIVERED') redirect(`/orders/${params.id}`);

  const siteName = settings.businessName;
  const invoiceNum = `INV-${params.id.replace('order-', '').slice(0, 10).toUpperCase()}`;
  const invoiceDate = formatDate(order.updatedAt);
  const dueDate = formatDate(order.updatedAt);

  // Tax calculations
  const gstRate = settings.gstRate;
  const cgstRate = gstRate / 2;
  const sgstRate = gstRate / 2;
  const total = Number(order.amount);
  // Back-calculate taxable: total = taxable * (1 + gstRate/100)
  const taxableTotal = parseFloat((total / (1 + gstRate / 100)).toFixed(2));
  const totalGst = parseFloat((total - taxableTotal).toFixed(2));
  const totalCgst = parseFloat((totalGst / 2).toFixed(2));
  const totalSgst = parseFloat((totalGst / 2).toFixed(2));

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 10mm 10mm 12mm 10mm; }
        }
        .inv-table th, .inv-table td { border: 1px solid #d1d5db; padding: 5px 7px; font-size: 11px; }
        .inv-table th { background: #f3f4f6; font-weight: 600; }
        .inv-outer { border: 1px solid #9ca3af; }
      `}</style>

      <div className="min-h-screen bg-[#f0f0f0] px-4 py-8 print:bg-white print:p-0 sm:px-6">

        {/* ── Toolbar ── */}
        <div className="no-print mx-auto mb-5 flex max-w-[820px] items-center justify-between gap-4">
          <Link href={`/orders/${params.id}`}
            className="text-[11px] font-medium text-[#627067] hover:text-[#172c27]">
            ← Back to order
          </Link>
          <InvoicePrintButton />
        </div>

        {/* ── Invoice document ── */}
        <div className="inv-outer mx-auto max-w-[820px] bg-white print:max-w-none print:border-none">

          {/* ── Top label ── */}
          <div className="flex items-center justify-between border-b border-gray-300 px-6 py-3">
            <span className="text-[13px] font-bold uppercase tracking-wide text-gray-700">
              Tax Invoice
            </span>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Original for Recipient
            </span>
          </div>

          {/* ── Seller + Logo ── */}
          <div className="flex items-start justify-between gap-6 border-b border-gray-300 px-6 py-4">
            <div className="max-w-[420px]">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                GSTIN {settings.gstin}
              </p>
              <h1 className="mt-1 text-[18px] font-black text-gray-900">{siteName}</h1>
              <p className="mt-1 whitespace-pre-line text-[11px] leading-5 text-gray-600">
                {settings.businessAddress}{settings.businessCity ? `,\n${settings.businessCity}` : ''}
                {settings.businessState ? `, ${settings.businessState}` : ''}
                {settings.businessPincode ? ` — ${settings.businessPincode}` : ''}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-600">
                Mobile {settings.businessPhone}
                {settings.businessEmail ? `  Email ${settings.businessEmail}` : ''}
              </p>
            </div>
            {/* Logo */}
            <div className="flex-none">
              <Image
                src="/logo.png"
                alt={siteName}
                width={120}
                height={60}
                className="object-contain"
                style={{ maxHeight: 60, width: 'auto' }}
              />
            </div>
          </div>

          {/* ── Invoice meta ── */}
          <div className="flex gap-0 border-b border-gray-300">
            {[
              { label: 'Invoice #', value: invoiceNum },
              { label: 'Invoice Date', value: invoiceDate },
              { label: 'Due Date', value: dueDate }
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 border-r border-gray-300 px-5 py-3 last:border-r-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">{label}</p>
                <p className="mt-1 text-[12px] font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Billing + Shipping ── */}
          <div className="grid grid-cols-2 border-b border-gray-300">
            <div className="border-r border-gray-300 px-5 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">
                Billing address
              </p>
              <p className="mt-2 text-[12px] font-semibold text-gray-800">{order.customerName || order.customerEmail}</p>
              {order.deliveryAddress && (
                <address className="mt-0.5 not-italic text-[11px] leading-5 text-gray-600">
                  <p>{order.deliveryAddress}</p>
                  <p>{order.deliveryCity}{order.deliveryState ? `, ${order.deliveryState}` : ''}, {order.deliveryPincode}</p>
                </address>
              )}
              <p className="mt-0.5 text-[11px] text-gray-600">Ph: {order.customerPhone}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">
                Shipping address
              </p>
              <p className="mt-2 text-[12px] font-semibold text-gray-800">{order.customerName || order.customerEmail}</p>
              {order.deliveryAddress && (
                <address className="mt-0.5 not-italic text-[11px] leading-5 text-gray-600">
                  <p>{order.deliveryAddress}</p>
                  <p>{order.deliveryCity}{order.deliveryState ? `, ${order.deliveryState}` : ''}, {order.deliveryPincode}</p>
                </address>
              )}
            </div>
          </div>

          {/* ── Place of supply ── */}
          <div className="border-b border-gray-300 px-5 py-2">
            <p className="text-[11px] text-gray-600">
              <span className="font-semibold">Place of Supply:</span>{' '}
              {order.deliveryState
                ? `${order.deliveryState.toUpperCase()} — PL-${order.deliveryState.toUpperCase().slice(0, 2)}`
                : 'MH-MAHARASHTRA'}
            </p>
          </div>

          {/* ── Items table ── */}
          <div className="px-5 py-4">
            <table className="inv-table w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-center w-8">#</th>
                  <th className="text-left">Item / Description</th>
                  <th className="text-center">HSN</th>
                  <th className="text-right">Taxable Amt</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Tax Amt ({gstRate}%)</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const lineTotal = Number(item.price);
                  const lineTaxable = parseFloat((lineTotal / (1 + gstRate / 100)).toFixed(2));
                  const lineTax = parseFloat((lineTotal - lineTaxable).toFixed(2));
                  const unitPrice = parseFloat((lineTaxable / item.quantity).toFixed(2));
                  return (
                    <tr key={item.variantId}>
                      <td className="text-center text-gray-500">{idx + 1}</td>
                      <td>
                        <span className="font-semibold text-gray-800">{item.productTitle}</span>
                        {item.variantTitle !== 'Default Title' && (
                          <div className="text-[10px] text-gray-500">
                            {item.variantTitle.replace(' / ', '\n')}
                          </div>
                        )}
                      </td>
                      <td className="text-center text-gray-600">{settings.hsnCode}</td>
                      <td className="text-right text-gray-700">
                        ₹{lineTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right text-gray-700">{item.quantity}</td>
                      <td className="text-right text-gray-700">
                        ₹{lineTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        <div className="text-[9px] text-gray-400">({gstRate}%)</div>
                      </td>
                      <td className="text-right font-semibold text-gray-900">
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right font-semibold text-gray-700">Totals</td>
                  <td className="text-right font-semibold text-gray-800">
                    ₹{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right font-semibold text-gray-800">
                    {order.totalQuantity}
                  </td>
                  <td className="text-right font-semibold text-gray-800">
                    ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-right font-bold text-gray-900">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Tax summary + totals ── */}
          <div className="flex gap-0 border-t border-gray-300">
            {/* Tax breakdown */}
            <div className="flex-1 border-r border-gray-300 px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">
                Tax Summary
              </p>
              <table className="inv-table w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left">GST Rate</th>
                    <th className="text-right">Taxable Amt</th>
                    <th className="text-right">CGST ({cgstRate}%)</th>
                    <th className="text-right">SGST ({sgstRate}%)</th>
                    <th className="text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{gstRate}%</td>
                    <td className="text-right">₹{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right font-semibold">₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Grand total */}
            <div className="w-[220px] flex-none px-5 py-3">
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Amount</span>
                  <span>₹{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IGST {gstRate}%</span>
                  <span>₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-1.5 text-[13px] font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Amount in words ── */}
          <div className="border-t border-gray-300 bg-gray-50 px-5 py-2">
            <p className="text-[11px] text-gray-700">
              <span className="font-semibold">Total Amount (in words): </span>
              {numberToWords(total)}
            </p>
          </div>

          {/* ── Pay via UPI + Bank details + signature ── */}
          <div className="grid grid-cols-3 gap-0 border-t border-gray-300">
            {/* UPI QR */}
            <div className="border-r border-gray-300 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">
                Pay using UPI
              </p>
              {settings.upiQrUrl ? (
                <div className="flex flex-col items-start gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.upiQrUrl}
                    alt="UPI QR code"
                    className="h-24 w-24 object-contain rounded-lg border border-gray-200"
                  />
                  {settings.upiId && (
                    <p className="text-[10px] text-gray-600 font-mono">{settings.upiId}</p>
                  )}
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[9px] text-gray-400">
                  {settings.upiId || 'UPI QR'}
                </div>
              )}
            </div>

            {/* Bank details */}
            <div className="border-r border-gray-300 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">
                Bank Details
              </p>
              <div className="space-y-0.5 text-[11px]">
                {[
                  { label: 'Bank', value: settings.bankName },
                  { label: 'Account #', value: settings.bankAccount },
                  { label: 'IFSC', value: settings.bankIfsc },
                  { label: 'Branch', value: settings.bankBranch }
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-2">
                    <span className="w-20 flex-none font-semibold text-gray-500">{label}:</span>
                    <span className="text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div className="flex flex-col items-end justify-between px-5 py-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                For {siteName}
              </span>
              <div className="flex flex-col items-center">
                {settings.signatureUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={settings.signatureUrl}
                    alt="Authorised Signatory"
                    className="h-12 w-32 object-contain"
                  />
                ) : (
                  <div className="h-10 w-28 border-b border-gray-400" />
                )}
                <p className="mt-1 text-[10px] text-gray-500">Authorised Signatory</p>
              </div>
            </div>
          </div>

          {/* ── Notes + Terms ── */}
          <div className="border-t border-gray-300 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-1">
              Notes
            </p>
            <p className="text-[11px] text-gray-600">Thank you for the Business</p>

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-1">
              Terms and Conditions
            </p>
            <div className="space-y-0.5">
              {settings.terms.split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className="text-[11px] text-gray-600">{line}</p>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
