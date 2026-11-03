import 'server-only';

export type InvoiceSettings = {
  gstin: string;
  pan: string;
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessPincode: string;
  businessPhone: string;
  businessEmail: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankBranch: string;
  gstRate: number;
  hsnCode: string;
  terms: string;
  upiId: string;
  upiQrUrl: string;
  signatureUrl: string;
};

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  gstin: '29AABCU9603R1ZX',
  pan: 'AABCU9603R',
  businessName: process.env.SITE_NAME ?? 'Leather Mart 313',
  businessAddress: 'Shop No. 1, Leather Market',
  businessCity: 'Mumbai',
  businessState: 'Maharashtra',
  businessPincode: '400001',
  businessPhone: '9999999999',
  businessEmail: 'info@leathermart313.com',
  bankName: 'YES Bank',
  bankAccount: '0123456789012345',
  bankIfsc: 'YESB0000123',
  bankBranch: 'Mumbai Main Branch',
  gstRate: 18,
  hsnCode: '4202',
  terms: '1. Customers may initiate a return within 4 days from the date of delivery.\n2. To qualify for a full refund, items must be returned in their original, unused, and unwashed condition.\n3. We reserve the right to reject returns that show visible signs of wear, tear, or altering.',
  upiId: '',
  upiQrUrl: '',
  signatureUrl: ''
};

function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function supabase(path: string, init?: RequestInit) {
  const config = getConfig();
  if (!config) throw new Error('Supabase is not configured.');
  const res = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase invoice settings error (${res.status}): ${detail}`);
  }
  return res;
}

type SettingsRow = Record<string, unknown>;

function mapRow(row: SettingsRow): InvoiceSettings {
  // The original SQL migration seeded the row with this single-line default.
  // If the DB still has that value (admin hasn't saved their own terms yet),
  // fall back to the full multi-line TypeScript default so invoices show all terms.
  const OLD_SQL_DEFAULT = '1. Goods once sold cannot be taken back or exchanged.';
  const dbTerms = String(row.terms ?? '').trim();
  const terms =
    !dbTerms || dbTerms === OLD_SQL_DEFAULT
      ? DEFAULT_INVOICE_SETTINGS.terms
      : dbTerms;

  return {
    gstin:           String(row.gstin ?? DEFAULT_INVOICE_SETTINGS.gstin),
    pan:             String(row.pan ?? DEFAULT_INVOICE_SETTINGS.pan),
    businessName:    String(row.business_name ?? DEFAULT_INVOICE_SETTINGS.businessName),
    businessAddress: String(row.business_address ?? DEFAULT_INVOICE_SETTINGS.businessAddress),
    businessCity:    String(row.business_city ?? DEFAULT_INVOICE_SETTINGS.businessCity),
    businessState:   String(row.business_state ?? DEFAULT_INVOICE_SETTINGS.businessState),
    businessPincode: String(row.business_pincode ?? DEFAULT_INVOICE_SETTINGS.businessPincode),
    businessPhone:   String(row.business_phone ?? DEFAULT_INVOICE_SETTINGS.businessPhone),
    businessEmail:   String(row.business_email ?? DEFAULT_INVOICE_SETTINGS.businessEmail),
    bankName:        String(row.bank_name ?? DEFAULT_INVOICE_SETTINGS.bankName),
    bankAccount:     String(row.bank_account ?? DEFAULT_INVOICE_SETTINGS.bankAccount),
    bankIfsc:        String(row.bank_ifsc ?? DEFAULT_INVOICE_SETTINGS.bankIfsc),
    bankBranch:      String(row.bank_branch ?? DEFAULT_INVOICE_SETTINGS.bankBranch),
    gstRate:         Number(row.gst_rate ?? DEFAULT_INVOICE_SETTINGS.gstRate),
    hsnCode:         String(row.hsn_code ?? DEFAULT_INVOICE_SETTINGS.hsnCode),
    terms,
    upiId:           String(row.upi_id ?? ''),
    upiQrUrl:        String(row.upi_qr_url ?? ''),
    signatureUrl:    String(row.signature_url ?? ''),
  };
}

export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  const config = getConfig();
  if (!config) return DEFAULT_INVOICE_SETTINGS;
  try {
    const res = await supabase('store_invoice_settings?id=eq.default&limit=1');
    const rows = (await res.json()) as SettingsRow[];
    if (!Array.isArray(rows) || rows.length === 0) return DEFAULT_INVOICE_SETTINGS;
    return mapRow(rows[0]!);
  } catch {
    return DEFAULT_INVOICE_SETTINGS;
  }
}

export async function saveInvoiceSettings(settings: InvoiceSettings): Promise<void> {
  await supabase('store_invoice_settings?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id:               'default',
      gstin:            settings.gstin.trim(),
      pan:              settings.pan.trim(),
      business_name:    settings.businessName.trim(),
      business_address: settings.businessAddress.trim(),
      business_city:    settings.businessCity.trim(),
      business_state:   settings.businessState.trim(),
      business_pincode: settings.businessPincode.trim(),
      business_phone:   settings.businessPhone.trim(),
      business_email:   settings.businessEmail.trim(),
      bank_name:        settings.bankName.trim(),
      bank_account:     settings.bankAccount.trim(),
      bank_ifsc:        settings.bankIfsc.trim(),
      bank_branch:      settings.bankBranch.trim(),
      gst_rate:         Number(settings.gstRate),
      hsn_code:         settings.hsnCode.trim(),
      terms:            settings.terms,
      upi_id:           settings.upiId.trim(),
      upi_qr_url:       settings.upiQrUrl.trim(),
      signature_url:    settings.signatureUrl.trim(),
      updated_at:       new Date().toISOString()
    })
  });
}
