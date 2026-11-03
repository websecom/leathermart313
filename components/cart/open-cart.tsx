import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function OpenCart({
  className,
  quantity
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e1d9] text-[#3e3c37] transition-colors hover:border-[#a45d3e]">
      <ShoppingCartIcon
        className={clsx('h-4 transition-all ease-in-out hover:scale-110 ', className)}
      />

      {quantity ? (
        <div className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a45d3e] px-1 text-[9px] font-medium text-white">
          {quantity}
        </div>
      ) : null}
    </div>
  );
}
