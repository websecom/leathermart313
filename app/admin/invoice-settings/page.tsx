import InvoiceSettingsForm from 'components/admin/invoice-settings-form';
import { requireAdmin } from 'lib/admin-auth';
import { getInvoiceSettings } from 'lib/invoice-settings';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Invoice Settings',
  description: 'Configure GST, bank details and invoice template.'
};

export default async function InvoiceSettingsPage() {
  await requireAdmin();
  const settings = await getInvoiceSettings();

  return (
    <main className="mx-auto min-h-screen max-w-[860px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/admin"
        className="mb-5 inline-flex text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
      >
        ← Admin dashboard
      </Link>
      <div className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
          Invoice settings
        </h1>
        <p className="mt-2 text-[14px] text-[#68736b]">
          Configure GSTIN, bank details, HSN codes, and terms shown on customer invoices.
        </p>
      </div>
      <InvoiceSettingsForm initialSettings={settings} />
    </main>
  );
}
