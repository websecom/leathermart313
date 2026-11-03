'use client';

import clsx from 'clsx';
import { SortFilterItem } from 'lib/constants';
import { createUrl } from 'lib/utils';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ListItem, PathFilterItem } from '.';

function PathFilterItem({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? 'p' : Link;

  newParams.delete('q');

  return (
    <li className="flex">
      <DynamicTag
        href={createUrl(item.path, newParams)}
        className={clsx(
          'flex w-full items-center rounded-lg px-3 py-2 text-[12px] font-medium transition-all duration-150',
          active
            ? 'bg-[#172c27] text-white shadow-sm'
            : 'text-[#59645b] hover:bg-[#e9eee6] hover:text-[#17211f]'
        )}
      >
        {active && (
          <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c6f36b]" aria-hidden="true" />
        )}
        {item.title}
      </DynamicTag>
    </li>
  );
}

function SortFilterItem({ item }: { item: SortFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get('sort') === item.slug;
  const newParams = new URLSearchParams(searchParams.toString());
  newParams.delete('sort');
  if (item.slug) newParams.set('sort', item.slug);
  const href = createUrl(pathname, newParams);
  const DynamicTag = active ? 'p' : Link;

  return (
    <li className="flex">
      <DynamicTag
        prefetch={!active ? false : undefined}
        href={href}
        className={clsx(
          'flex w-full items-center rounded-lg px-3 py-2 text-[12px] font-medium transition-all duration-150',
          active
            ? 'bg-[#172c27] text-white shadow-sm'
            : 'text-[#59645b] hover:bg-[#e9eee6] hover:text-[#17211f]'
        )}
      >
        {active && (
          <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c6f36b]" aria-hidden="true" />
        )}
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return 'path' in item ? <PathFilterItem item={item} /> : <SortFilterItem item={item} />;
}
