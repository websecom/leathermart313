const Price = ({
  amount,
  compareAtAmount,
  className,
  currencyCode = 'INR'
}: {
  amount: string;
  compareAtAmount?: string;
  className?: string;
  currencyCode: string;
} & React.ComponentProps<'div'>) => {
  const format = (value: string) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol'
    }).format(parseFloat(value));
  const hasDiscount = compareAtAmount !== undefined && Number(compareAtAmount) > Number(amount);
  const discountPercent = hasDiscount
    ? Math.round(((Number(compareAtAmount) - Number(amount)) / Number(compareAtAmount)) * 100)
    : 0;

  return (
    <div suppressHydrationWarning={true} className={className}>
      {hasDiscount ? (
        <>
          <span className="text-[#8a928b] line-through decoration-1">
            {format(compareAtAmount)}
          </span>
          <span className="font-semibold text-[#b14435]">{format(amount)}</span>
          <span className="rounded-full bg-[#fbefec] px-2 py-0.5 text-[10px] font-semibold text-[#a33e30]">
            {discountPercent}% off
          </span>
        </>
      ) : (
        <span>{format(amount)}</span>
      )}
    </div>
  );
};

export default Price;
