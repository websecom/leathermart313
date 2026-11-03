import Link from 'next/link';

import LogoSquare from 'components/logo-square';
import { getMenu } from 'lib/store';

const siteName = process.env.SITE_NAME || 'LEATHER MART 313';

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const [headerItems, footerItems] = await Promise.all([getMenu('header'), getMenu('footer')]);
  const shopLinks = headerItems.filter((item) => item.path !== '/about');
  const informationLinks = footerItems;

  return (
    <footer className="text-sm text-neutral-500">
      {/* ── Newsletter section ── */}
      <section
        aria-labelledby="newsletter-title"
        className="mx-auto w-full max-w-[1380px] px-4 pb-8 sm:px-6 lg:px-8"
      >
        <div className="relative overflow-hidden rounded-3xl border border-[#d8e9c4] bg-gradient-to-br from-[#f5faea] via-[#eef7df] to-[#e0edcc] px-6 py-10 shadow-[0_16px_50px_rgba(23,44,39,0.09)] sm:px-10 sm:py-12">
          {/* Decorative orbs */}
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#c6f36b]/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-[#a8d860]/20 blur-2xl"
          />
          <div className="relative mx-auto flex max-w-5xl flex-col justify-between gap-8 md:flex-row md:items-center md:gap-12">
            <div className="max-w-lg">
              <span className="accent-pill mb-4 inline-flex">A little note from us</span>
              <h2
                id="newsletter-title"
                className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.055em] text-[#17211f] sm:text-[36px]"
              >
                Good things, straight to your inbox.
              </h2>
              <p className="mt-3 text-[13px] leading-6 text-[#68736b]">
                Be first to hear about new arrivals, thoughtful edits, and occasional offers.
              </p>
            </div>
            <div className="w-full max-w-md">
              <form className="flex flex-col gap-2.5 sm:flex-row">
                <label className="sr-only" htmlFor="newsletter-email">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Your email address"
                  disabled
                  className="min-w-0 flex-1 rounded-full border border-[#cdddb8] bg-white/85 px-5 py-3.5 text-[12px] text-[#17211f] shadow-sm outline-none placeholder:text-[#929a91] disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled
                  className="rounded-full bg-[#172c27] px-6 py-3.5 text-[11px] font-bold text-white opacity-55 shadow-sm"
                >
                  Coming soon
                </button>
              </form>
              <p className="mt-2.5 text-[10px] leading-4 text-[#7c857b]">
                Newsletter signup will be available once an email service is connected.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* ── Dark footer ── */}
      <div className="bg-[#111f1c] text-white">
        <div className="mx-auto grid w-full max-w-[1380px] grid-cols-2 gap-x-8 gap-y-10 px-6 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] md:gap-10 md:py-16">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <Link className="group inline-flex items-center gap-3" href="/">
              <LogoSquare size="sm" />
              <span className="text-sm font-black uppercase tracking-[0.18em] transition-colors group-hover:text-[#c6f36b]">{siteName}</span>
            </Link>
            <p className="mt-4 max-w-xs text-[12px] leading-6 text-[#9aada5]">
              Thoughtful everyday pieces, chosen to bring a little more ease to what you wear and carry.
            </p>
            {/* Star rating */}
            <div className="mt-5 flex items-center gap-2">
              <span className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className="sparkle-star h-4 w-4 text-[#c6f36b]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
              <span className="text-[11px] font-medium text-[#9aada5]">4.9 · 2,400+ reviews</span>
            </div>
          </div>

          <nav aria-label="Shop">
            <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c6f36b]">
              Shop
            </h2>
            <ul className="space-y-3.5">
              {shopLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    className="group inline-flex items-center gap-1.5 text-[12px] text-[#c4d0c8] transition-all duration-200 hover:translate-x-1 hover:text-[#c6f36b] motion-reduce:transform-none motion-reduce:transition-none"
                    href={item.path}
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-[#c6f36b]/0 transition-colors group-hover:bg-[#c6f36b]" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Information">
            <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c6f36b]">
              Information
            </h2>
            <ul className="space-y-3.5">
              {informationLinks.map((item) => (
                <li key={item.path}>
                  <Link
                    className="group inline-flex items-center gap-1.5 text-[12px] text-[#c4d0c8] transition-all duration-200 hover:translate-x-1 hover:text-[#c6f36b] motion-reduce:transform-none motion-reduce:transition-none"
                    href={item.path}
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-[#c6f36b]/0 transition-colors group-hover:bg-[#c6f36b]" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c6f36b]">
              Need a hand?
            </h2>
            <p className="text-[12px] leading-6 text-[#9aada5]">
              Looking for store details or have a question? Visit our contact page.
            </p>
            <Link
              className="group mt-4 inline-flex items-center gap-2 rounded-full border border-[#c6f36b]/30 px-4 py-2.5 text-[11px] font-bold text-[#c6f36b] transition-all hover:border-[#c6f36b] hover:bg-[#c6f36b] hover:text-[#17211f]"
              href="/contact"
            >
              Get in touch
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <nav aria-label="Social media" className="mt-6 flex items-center gap-2.5">
              <a
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[#ff0033] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-110 hover:border-[#ff0033]/60 hover:bg-[#ff0033]/15 hover:shadow-[0_6px_20px_rgba(255,0,51,0.25)] motion-reduce:transform-none motion-reduce:transition-none"
                href="https://www.youtube.com/"
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
                </svg>
              </a>
              <a
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[#1877f2] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-110 hover:border-[#1877f2]/60 hover:bg-[#1877f2]/15 hover:shadow-[0_6px_20px_rgba(24,119,242,0.25)] motion-reduce:transform-none motion-reduce:transition-none"
                href="https://www.facebook.com/"
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.3-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21h3.4Z" />
                </svg>
              </a>
              <a
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[#e4405f] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-110 hover:border-[#e4405f]/60 hover:bg-[#e4405f]/15 hover:shadow-[0_6px_20px_rgba(228,64,95,0.25)] motion-reduce:transform-none motion-reduce:transition-none"
                href="https://www.instagram.com/"
                rel="noreferrer"
                target="_blank"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[#25d366] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-110 hover:border-[#25d366]/60 hover:bg-[#25d366]/15 hover:shadow-[0_6px_20px_rgba(37,211,102,0.25)] motion-reduce:transform-none motion-reduce:transition-none"
                href="https://www.whatsapp.com/"
                rel="noreferrer"
                target="_blank"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                >
                  <path d="M20.2 11.7a8.1 8.1 0 0 1-12 7.1L4 20l1.2-4a8.1 8.1 0 1 1 15-4.3Z" />
                  <path d="M9 8.5c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .6.5.8 1.2 1.5 2 1.9.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.5 0 .5-.2 1-.6 1.3-.4.4-1 .6-1.6.5-1-.1-2.4-.8-3.7-2-1.3-1.2-2.1-2.6-2.3-3.6-.1-.7.2-1.4.7-1.8Z" />
                </svg>
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8">
          <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-2 px-6 py-5 text-[10px] text-[#6e8078] sm:px-8 md:flex-row md:items-center md:justify-between">
            <p>&copy; {currentYear} {siteName}. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-[#c6f36b]">✦</span>
              Thoughtfully made for everyday.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
