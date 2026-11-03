import clsx from 'clsx';
import Price from './price';

const Label = ({
  title,
  amount,
  compareAtAmount,
  currencyCode,
  position = 'bottom'
}: {
  title: string;
  amount: string;
  compareAtAmount?: string;
  currencyCode: string;
  position?: 'bottom' | 'center';
}) => {
  return (
    <div
      className={clsx('absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label', {
        'lg:px-20 lg:pb-[35%]': position === 'center'
      })}
    >
      <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
        <h3 className="mr-4 line-clamp-2 flex-grow pl-2 leading-none tracking-tight">{title}</h3>
        <Price
          className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 rounded-full bg-white/95 px-3 py-2 text-[11px] text-[#17211f] shadow-sm"
          amount={amount}
          compareAtAmount={compareAtAmount}
          currencyCode={currencyCode}
        />
      </div>
    </div>
  );
};

export default Label;
