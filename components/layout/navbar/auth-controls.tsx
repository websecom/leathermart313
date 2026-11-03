'use client';

import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function AuthControls() {
  const { isSignedIn } = useAuth();

  return (
    <div className="flex items-center gap-1.5">
      {!isSignedIn ? (
        <>
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-full border border-[#d9e4d0] bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold text-[#4a5a4d] shadow-sm transition-all duration-200 hover:border-[#c6f36b] hover:bg-[#c6f36b] hover:text-[#17211f]"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-full bg-[#172c27] px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#27483d]"
            >
              Sign up
            </button>
          </SignUpButton>
        </>
      ) : (
        <div className="flex items-center gap-2">
          {/* My Orders button */}
          <Link
            href="/orders"
            className="flex items-center gap-1.5 rounded-full border border-[#d9e4d0] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#4a5a4d] shadow-sm transition-all duration-200 hover:border-[#c6f36b] hover:bg-[#c6f36b] hover:text-[#17211f]"
          >
            {/* Package icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
            </svg>
            My orders
          </Link>
          {/* User avatar */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8 rounded-full ring-2 ring-[#c6f36b]/60 hover:ring-[#c6f36b]'
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
