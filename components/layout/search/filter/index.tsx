import { SortFilterItem } from 'lib/constants';
import FilterItemDropdown from './dropdown';
import { FilterItem } from './item';

export type ListItem = SortFilterItem | PathFilterItem;
export type PathFilterItem = { title: string; path: string };

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <>
      {list.map((item: ListItem, i) => (
        <FilterItem key={i} item={item} />
      ))}
    </>
  );
}

export default function FilterList({ list, title }: { list: ListItem[]; title?: string }) {
  return (
    <nav>
      {title ? (
        <p className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#4a6e2a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c6f36b]" />
          {title}
        </p>
      ) : null}
      {/* Desktop list */}
      <ul className="hidden space-y-0.5 md:block">
        <FilterItemList list={list} />
      </ul>
      {/* Mobile dropdown */}
      <ul className="md:hidden">
        <FilterItemDropdown list={list} />
      </ul>
    </nav>
  );
}
