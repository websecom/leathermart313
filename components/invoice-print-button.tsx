'use client';

export default function InvoicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-full bg-[#172c27] px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d]"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v5a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9v-1h8v3H6v-2zm8-4a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd" />
      </svg>
      Print / Save as PDF
    </button>
  );
}
