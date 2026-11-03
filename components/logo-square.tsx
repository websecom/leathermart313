import clsx from 'clsx';
import Image from 'next/image';

export default function LogoSquare({ size }: { size?: 'sm' | undefined }) {
  return (
    <div
      className={clsx(
        'flex flex-none items-center justify-center overflow-hidden',
        {
          'h-[56px] w-[56px] rounded-xl': !size,
          'h-[44px] w-[44px] rounded-[10px]': size === 'sm'
        }
      )}
    >
      <Image
        src="/logo.png"
        alt={`${process.env.NEXT_PUBLIC_SITE_NAME || 'Northstar'} logo`}
        width={size === 'sm' ? 44 : 56}
        height={size === 'sm' ? 44 : 56}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}
