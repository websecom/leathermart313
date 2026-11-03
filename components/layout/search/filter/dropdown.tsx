'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { ListItem } from '.';
import { FilterItem } from './item';

export default function FilterItemDropdown({ list }: { list: ListItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState('');
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSelect(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    list.forEach((listItem: ListItem) => {
      if (
        ('path' in listItem && pathname === listItem.path) ||
        ('slug' in listItem && searchParams.get('sort') === listItem.slug)
      ) {
        setActive(listItem.title);
      }
    });
  }, [pathname, list, searchParams]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpenSelect(!openSelect)}
        className="flex w-full items-center justify-between rounded-xl border border-[#dce3da] bg-[#fbfcfa] px-4 py-2.5 text-[12px] font-medium text-[#17211f] shadow-sm transition-colors hover:border-[#c6f36b]"
        aria-expanded={openSelect}
      >
        <span>{active || 'Select…'}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-[#68736b] transition-transform duration-200 ${openSelect ? 'rotate-180' : ''}`}
        />
      </button>

      {openSelect && (
        <div
          onClick={() => setOpenSelect(false)}
          className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-[#dce3da] bg-white shadow-[0_8px_30px_rgba(23,44,39,0.12)]"
        >
          <ul className="p-1.5">
            {list.map((item: ListItem, i) => (
              <FilterItem key={i} item={item} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
