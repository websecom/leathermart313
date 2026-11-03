import clsx from 'clsx';

export default function LogoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${process.env.SITE_NAME || 'LEATHER MART 313'} logo`}
      viewBox="0 0 32 32"
      {...props}
      className={clsx('h-4 w-4 fill-black dark:fill-white', props.className)}
    >
      <path d="M16 0L19.8 11.8L32 16L19.8 20.2L16 32L12.2 20.2L0 16L12.2 11.8L16 0Z" />
    </svg>
  );
}
