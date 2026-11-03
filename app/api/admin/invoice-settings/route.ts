import { isCurrentUserAdmin } from 'lib/admin-auth';
import { getInvoiceSettings, saveInvoiceSettings, type InvoiceSettings } from 'lib/invoice-settings';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }
  const settings = await getInvoiceSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const s = body as Partial<InvoiceSettings>;

  if (!s.gstin?.trim() || !s.businessName?.trim() || !s.businessAddress?.trim()) {
    return NextResponse.json({ error: 'GSTIN, business name, and address are required.' }, { status: 400 });
  }
  if (typeof s.gstRate !== 'number' || s.gstRate < 0 || s.gstRate > 100) {
    return NextResponse.json({ error: 'GST rate must be between 0 and 100.' }, { status: 400 });
  }

  const current = await getInvoiceSettings();
  const updated: InvoiceSettings = {
    gstin:           s.gstin?.trim()           ?? current.gstin,
    pan:             s.pan?.trim()             ?? current.pan,
    businessName:    s.businessName?.trim()    ?? current.businessName,
    businessAddress: s.businessAddress?.trim() ?? current.businessAddress,
    businessCity:    s.businessCity?.trim()    ?? current.businessCity,
    businessState:   s.businessState?.trim()   ?? current.businessState,
    businessPincode: s.businessPincode?.trim() ?? current.businessPincode,
    businessPhone:   s.businessPhone?.trim()   ?? current.businessPhone,
    businessEmail:   s.businessEmail?.trim()   ?? current.businessEmail,
    bankName:        s.bankName?.trim()        ?? current.bankName,
    bankAccount:     s.bankAccount?.trim()     ?? current.bankAccount,
    bankIfsc:        s.bankIfsc?.trim()        ?? current.bankIfsc,
    bankBranch:      s.bankBranch?.trim()      ?? current.bankBranch,
    gstRate:         s.gstRate                 ?? current.gstRate,
    hsnCode:         s.hsnCode?.trim()         ?? current.hsnCode,
    terms:           s.terms                   ?? current.terms,
    upiId:           s.upiId?.trim()           ?? current.upiId,
    upiQrUrl:        s.upiQrUrl?.trim()        ?? current.upiQrUrl,
    signatureUrl:    s.signatureUrl?.trim()    ?? current.signatureUrl,
  };

  try {
    await saveInvoiceSettings(updated);
    // Invalidate all invoice pages so changes reflect immediately
    revalidatePath('/orders', 'layout');
    revalidatePath('/admin/invoice-settings');
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('[invoice-settings] save error:', error);
    return NextResponse.json({ error: 'Could not save settings. Check Supabase configuration.' }, { status: 502 });
  }
}
