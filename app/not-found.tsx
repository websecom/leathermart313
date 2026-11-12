// Force dynamic rendering so Clerk's headers() usage doesn't break
// the static build of the /_not-found route.
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#607b4a]">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[#17211f] sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-[14px] leading-6 text-[#68736b]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-[#172c27] px-6 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#27483d]"
      >
        Back to home
      </Link>
    </div>
  );
}
