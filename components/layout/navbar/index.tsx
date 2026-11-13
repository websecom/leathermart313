import Cart from 'components/cart';
import OpenCart from 'components/cart/open-cart';
import LogoSquare from 'components/logo-square';
import { getMenu } from 'lib/store';
import type { MenuItem } from 'lib/types';
import Link from 'next/link';
import { Suspense } from 'react';
import AuthControls from './auth-controls';
import MobileMenu from './mobile-menu';
import Search from './search';
const siteName = process.env.SITE_NAME || 'LEATHER MART 313';

export default async function Navbar() {
  const menu = await getMenu('header');

  return (
    <nav className="navbar-gradient-border sticky top-0 z-40 bg-[#f2e8d9]/90 px-4 backdrop-blur-xl lg:px-8">
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between">
        <div className="block flex-none md:hidden">
          <Suspense>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>
        <div className="flex w-full items-center">
          <div className="flex min-w-0 flex-1 items-center overflow-hidden">
            <Link href="/" className="group mr-3 flex min-w-0 items-center gap-2 md:w-auto lg:mr-9">
              <LogoSquare size="sm" />
              <div className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-[#17211f] transition-colors group-hover:text-[#4a8030]">
                {siteName}
              </div>
            </Link>
            {menu.length ? (
              <ul className="hidden gap-1 text-[12px] md:flex md:items-center xl:gap-1">
                {menu.map((item: MenuItem) => (
                  <li key={item.title}>
                    <Link
                      href={item.path}
                      className="group relative whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-medium text-[#4a5a4d] transition-all duration-200 hover:bg-[#c6f36b]/15 hover:text-[#2d5c1a] focus-visible:text-[#2d5c1a]"
                    >
                      {item.title}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#c6f36b] to-[#9cc94d] transition-transform duration-250 group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="hidden flex-none justify-center px-5 md:flex">
            <Suspense>
              <Search />
            </Suspense>
          </div>
          <div className="ml-auto flex flex-none items-center gap-3 justify-end">
            <div className="hidden md:flex md:items-center md:gap-3">
              <Suspense fallback={null}>
                <AuthControls />
              </Suspense>
            </div>
            <Suspense fallback={<OpenCart />}>
              <Cart />
            </Suspense>
          </div>
        </div>
      </div>
    </nav>
  );
}
