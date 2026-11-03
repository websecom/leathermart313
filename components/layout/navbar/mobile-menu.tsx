'use client';

import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Dialog, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import type { MenuItem } from 'lib/types';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import Search from './search';

export default function MobileMenu({ menu }: { menu: MenuItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <button
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e0e6dd] text-[#17211f] transition-colors hover:border-[#58723e] md:hidden"
      >
        <Bars3Icon className="h-4" />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeMobileMenu} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-[-100%]"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-[-100%]"
          >
            <Dialog.Panel className="fixed bottom-0 left-0 right-0 top-0 flex h-full w-full flex-col bg-[#f2e8d9] pb-6">
              <div className="p-4">
                <button
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#e0e6dd] text-[#17211f] transition-colors"
                  onClick={closeMobileMenu}
                  aria-label="Close mobile menu"
                >
                  <XMarkIcon className="h-6" />
                </button>

                <div className="mb-4 w-full">
                  <Search />
                </div>
                {menu.length ? (
                  <ul className="flex w-full flex-col">
                    {menu.map((item: MenuItem) => (
                      <li
                        className="border-b border-[#e4e8e1] py-4 text-lg font-medium tracking-tight text-[#17211f] transition-colors duration-200 hover:translate-x-1 hover:text-[#58723e] motion-reduce:transform-none motion-reduce:transition-none"
                        key={item.title}
                      >
                        <Link href={item.path} onClick={closeMobileMenu}>
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {/* ── Auth controls ── */}
                <div className="mt-6 flex items-center gap-2.5">
                  <MobileAuthControls />
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}

function MobileAuthControls() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <>
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-full border border-[#d9e4d0] bg-white/70 px-4 py-2 text-[12px] font-semibold text-[#4a5a4d] transition-all hover:border-[#c6f36b] hover:bg-[#c6f36b] hover:text-[#17211f]"
          >
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="rounded-full bg-[#172c27] px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-[#27483d]"
          >
            Sign up
          </button>
        </SignUpButton>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* My Orders link */}
      <Link
        href="/orders"
        className="flex items-center gap-2 rounded-xl border border-[#dce3da] bg-white/70 px-4 py-2.5 text-[13px] font-semibold text-[#4a5a4d] transition-all hover:border-[#c6f36b] hover:bg-[#c6f36b] hover:text-[#17211f]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
        </svg>
        My orders
      </Link>
      <div className="flex items-center gap-2.5">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-9 w-9 rounded-full ring-2 ring-[#c6f36b]/60'
            }
          }}
        />
        <span className="text-[12px] font-medium text-[#4a5a4d]">My account</span>
      </div>
    </div>
  );
}
