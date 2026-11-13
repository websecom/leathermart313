import Footer from 'components/layout/footer';
import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Visit Leather Mart 313 at Shop No. B47, Hazrat Tipu Sultan AMC Market, Amravati. Call us or drop a WhatsApp message.'
};

/* ── Static store data (from your Google Business listing) ── */
const STORE = {
  name:    'Leather Mart 313',
  tagline: 'Original Leather Products Manufacturer',
  rating:  5.0,
  reviews: 3,
  phone:   '09326569083',
  phoneDisplay: '093265 69083',
  whatsapp: '919326569083',
  address: {
    line1: 'Shop No. B47, Hazrat Tipu Sultan AMC Market',
    line2: 'Walgaon Rd, Jameel Colony, Transport Nagar',
    city:  'Amravati',
    state: 'Maharashtra',
    pin:   '444601'
  },
  hours: 'Open · Closes 11:30 pm',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3722.4!2d77.763!3d20.934!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sLeather+Mart+313!5e0!3m2!1sen!2sin!4v1699000000000!5m2!1sen!2sin',
  directionsUrl:
    'https://www.google.com/maps/dir//Shop+No.+B47,+Hazrat+Tipu+Sultan+AMC+Market,+Walgaon+Rd,+Jameel+Colony,+Transport+Nagar,+Amravati,+Maharashtra+444601',
  mapsUrl:
    'https://maps.app.goo.gl/LeatherMart313Amravati'
};

/* ── Star renderer ── */
function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= Math.floor(rating);
        const half   = !filled && i < rating;
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={`h-4 w-4 ${filled || half ? 'text-[#f59e0b]' : 'text-[#e2d5b8]'}`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </span>
  );
}

/* ── Rating bar (like Google's histogram) ── */
function RatingBar({ star, pct }: { star: number; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 text-right text-[11px] text-[#68736b]">{star}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8d9c4]">
        <div
          className="h-full rounded-full bg-[#f59e0b]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-[11px] text-[#68736b]">
            <li><Link href="/" className="hover:text-[#172c27]">Home</Link></li>
            <li aria-hidden="true" className="text-[#b8c5b4]">/</li>
            <li className="font-medium text-[#172c27]">Contact</li>
          </ol>
        </nav>

        {/* ── Header ── */}
        <div className="mb-10 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
            Get in touch
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-[#17211f] sm:text-4xl">
            Visit us or drop a message
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#68736b]">
            We&apos;re a family-run leather goods shop in Amravati. Walk in, call us, or ping us on
            WhatsApp — we&apos;re happy to help.
          </p>
        </div>

        {/* ── Main grid ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ── LEFT: Map ── */}
          <div className="overflow-hidden rounded-3xl border border-[#e8d9c4] shadow-sm">
            <iframe
              title="Leather Mart 313 on Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d938.7714879745516!2d77.76311556960887!3d20.934225199999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd6975e57eb0ee5%3A0x20d0aa41d5e2c5de!2sLeather%20Mart%20313!5e0!3m2!1sen!2sin!4v1750000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              className="min-h-[320px] w-full lg:min-h-[520px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* ── RIGHT: Info card ── */}
          <div className="flex flex-col gap-4">

            {/* Store name card */}
            <div className="rounded-2xl border border-[#e8d9c4] bg-[var(--store-surface)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-bold tracking-tight text-[#17211f]">
                    {STORE.name}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#68736b]">{STORE.tagline}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Stars rating={STORE.rating} />
                    <span className="text-[12px] font-semibold text-[#17211f]">{STORE.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-[#68736b]">· {STORE.reviews} Reviews</span>
                  </div>
                </div>
                {/* Google Maps icon badge */}
                <a
                  href={STORE.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on Google Maps"
                  className="flex-none rounded-xl border border-[#e8d9c4] bg-white p-2 shadow-sm transition-shadow hover:shadow-md"
                >
                  <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
                    <path fill="#4285F4" d="M24 4C15.163 4 8 11.163 8 20c0 12 16 28 16 28s16-16 16-28c0-8.837-7.163-16-16-16z"/>
                    <circle cx="24" cy="20" r="6" fill="white"/>
                  </svg>
                </a>
              </div>

              {/* Quick action buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`tel:${STORE.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e8d9c4] bg-white px-4 py-2 text-[12px] font-semibold text-[#17211f] shadow-sm transition-all hover:border-[#9aad8e] hover:bg-[#f5faea]"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-[#607b4a]" aria-hidden="true">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Call
                </a>
                <a
                  href={`https://wa.me/${STORE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#c3e8ca] bg-[#f0fbf1] px-4 py-2 text-[12px] font-semibold text-[#1a6630] shadow-sm transition-all hover:bg-[#dcf5e1]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M20.2 11.7a8.1 8.1 0 0 1-12 7.1L4 20l1.2-4a8.1 8.1 0 1 1 15-4.3Z" />
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={STORE.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e8d9c4] bg-white px-4 py-2 text-[12px] font-semibold text-[#17211f] shadow-sm transition-all hover:border-[#9aad8e] hover:bg-[#f5faea]"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-[#607b4a]" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Directions
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#e8d9c4] bg-[var(--store-surface)] px-5 py-4">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#edf3e7]">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4.5 w-4.5 text-[#607b4a]" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" />
                  <path strokeLinecap="round" d="M10 6v4l2.5 2.5" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#1a6630]">{STORE.hours}</p>
                <p className="mt-0.5 text-[11px] text-[#68736b]">Monday – Sunday</p>
              </div>
            </div>

            {/* Address */}
            <a
              href={STORE.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-3 rounded-2xl border border-[#e8d9c4] bg-[var(--store-surface)] px-5 py-4 transition-colors hover:border-[#9aad8e]"
            >
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#edf3e7]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#607b4a]" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <address className="not-italic text-[12px] leading-5 text-[#334239]">
                  <p className="font-medium">{STORE.address.line1}</p>
                  <p className="text-[#68736b]">{STORE.address.line2}</p>
                  <p className="text-[#68736b]">{STORE.address.city}, {STORE.address.state} {STORE.address.pin}</p>
                </address>
              </div>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 flex-none self-center text-[#9aad8e] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Phone */}
            <a
              href={`tel:${STORE.phone}`}
              className="group flex items-center gap-3 rounded-2xl border border-[#e8d9c4] bg-[var(--store-surface)] px-5 py-4 transition-colors hover:border-[#9aad8e]"
            >
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#edf3e7]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#607b4a]" aria-hidden="true">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-[#17211f]">{STORE.phoneDisplay}</p>
                <p className="text-[11px] text-[#68736b]">Tap to call</p>
              </div>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 flex-none text-[#9aad8e] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Google review summary */}
            <div className="rounded-2xl border border-[#e8d9c4] bg-[var(--store-surface)] px-5 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#17211f]">
                Google review summary
              </p>
              <div className="mt-3 flex items-end gap-5">
                {/* Bar chart */}
                <div className="flex-1 space-y-1.5">
                  <RatingBar star={5} pct={100} />
                  <RatingBar star={4} pct={0} />
                  <RatingBar star={3} pct={0} />
                  <RatingBar star={2} pct={0} />
                  <RatingBar star={1} pct={0} />
                </div>
                {/* Score */}
                <div className="flex-none text-right">
                  <p className="text-[42px] font-black leading-none tracking-tight text-[#17211f]">
                    {STORE.rating.toFixed(1)}
                  </p>
                  <Stars rating={STORE.rating} />
                  <p className="mt-1 text-[10px] text-[#68736b]">{STORE.reviews} reviews</p>
                </div>
              </div>
              <a
                href={`https://search.google.com/local/writereview?placeid=ChIJ5Q7rV15ndzkQXsXiVUGq0CA`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#4285F4]/30 bg-[#f0f4ff] py-2.5 text-[12px] font-semibold text-[#4285F4] transition-all hover:bg-[#4285F4] hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                </svg>
                Write a Google review
              </a>
            </div>

          </div>
        </div>

        {/* ── Bottom: Contact channels ── */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${STORE.whatsapp}?text=Hi%2C%20I%20have%20a%20question%20about%20your%20products.`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-[#c3e8ca] bg-[#f0fbf1] p-5 transition-all hover:border-[#6dca7a] hover:shadow-sm"
          >
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#25d366]">
              <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5" aria-hidden="true">
                <path d="M20.2 11.7a8.1 8.1 0 0 1-11.9 7.1L4 20l1.2-4.1a8 8 0 1 1 15 4.1-.1-.3zm-8.1-14A9.9 9.9 0 0 0 2.2 11.7a9.8 9.8 0 0 0 1.4 5L2 22l5.5-1.4a10 10 0 1 0 4.6-22.9zm4.9 13.9c-.1-.2-.4-.3-.8-.5l-1.5-.7c-.2-.1-.4-.1-.6.1l-.6.7c-.2.2-.4.2-.6.1-.8-.4-1.5-1-2-1.9-.2-.2-.2-.4 0-.6l.5-.6c.2-.2.2-.4.1-.6l-.7-1.6c-.1-.3-.3-.4-.5-.4h-.5c-.3 0-.5 0-.7.4-.4.5-.6 1.1-.5 1.8.2 1 1 2.4 2.3 3.6 1.3 1.2 2.7 1.9 3.7 2 .6.1 1.2-.1 1.6-.5.4-.3.6-.8.6-1.3 0-.2-.1-.4-.3-.6z"/>
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1a6630]">Chat on WhatsApp</p>
              <p className="mt-0.5 text-[11px] text-[#4a7a56]">Quickest way to reach us</p>
            </div>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="ml-auto h-4 w-4 text-[#6dca7a] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Call */}
          <a
            href={`tel:${STORE.phone}`}
            className="group flex items-center gap-4 rounded-2xl border border-[#e8d9c4] bg-[var(--store-surface)] p-5 transition-all hover:border-[#9aad8e] hover:shadow-sm"
          >
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#edf3e7]">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[#4a6e2a]" aria-hidden="true">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#17211f]">Call the store</p>
              <p className="mt-0.5 text-[11px] text-[#68736b]">{STORE.phoneDisplay}</p>
            </div>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="ml-auto h-4 w-4 text-[#9aad8e] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Directions */}
          <a
            href={STORE.directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-[#e8d9c4] bg-[var(--store-surface)] p-5 transition-all hover:border-[#9aad8e] hover:shadow-sm"
          >
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#edf3e7]">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[#4a6e2a]" aria-hidden="true">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#17211f]">Get directions</p>
              <p className="mt-0.5 text-[11px] text-[#68736b]">Open in Google Maps</p>
            </div>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="ml-auto h-4 w-4 text-[#9aad8e] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

      </div>
      <Footer />
    </>
  );
}
