'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { createUrl } from 'lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function Gallery({ images }: { images: { src: string; altText: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedIndex = Number(searchParams.get('image') || 0);
  const imageIndex =
    Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < images.length
      ? requestedIndex
      : 0;
  const activeImage = images[imageIndex];

  function imageUrl(index: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('image', String(index));
    return createUrl(pathname, params);
  }

  const nextImageIndex = (imageIndex + 1) % images.length;
  const previousImageIndex = (imageIndex + images.length - 1) % images.length;

  return (
    <div>
      <div
        className="group relative aspect-[4/5] max-h-[720px] w-full overflow-hidden rounded-2xl bg-[#e9ece7]"
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width) * 100;
          const y = ((event.clientY - bounds.top) / bounds.height) * 100;
          event.currentTarget.style.setProperty('--zoom-x', `${x}%`);
          event.currentTarget.style.setProperty('--zoom-y', `${y}%`);
        }}
      >
        {activeImage ? (
          <Image
            key={activeImage.src}
            className="cursor-zoom-in object-cover transition-transform duration-200 ease-out group-hover:scale-[2]"
            style={{ transformOrigin: 'var(--zoom-x, 50%) var(--zoom-y, 50%)' }}
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            alt={activeImage.altText}
            src={activeImage.src}
            priority
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#17211f]/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {images.length > 1 ? (
          <>
            <Link
              aria-label="Previous product image"
              href={imageUrl(previousImageIndex)}
              scroll={false}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[#fbfcfa]/85 text-[#17211f] shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white sm:left-5 sm:h-11 sm:w-11"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <Link
              aria-label="Next product image"
              href={imageUrl(nextImageIndex)}
              scroll={false}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[#fbfcfa]/85 text-[#17211f] shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white sm:right-5 sm:h-11 sm:w-11"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <span className="absolute bottom-4 right-4 rounded-full bg-[#17211f]/65 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {imageIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul aria-label="Product images" className="scrollbar-hidden mt-4 flex gap-2.5 overflow-x-auto py-1">
          {images.map((image, index) => {
            const isActive = index === imageIndex;
            return (
              <li key={`${image.src}-${index}`} className="h-[76px] w-[64px] flex-none sm:h-[92px] sm:w-[76px]">
                <Link
                  aria-label={`View product image ${index + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                  href={imageUrl(index)}
                  scroll={false}
                  className={`group/thumb relative block h-full w-full overflow-hidden rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-[#58723e] ring-2 ring-[#c6f36b]/60'
                      : 'border-transparent opacity-70 hover:border-[#cbd5c7] hover:opacity-100'
                  }`}
                >
                  <Image
                    alt={image.altText}
                    src={image.src}
                    fill
                    sizes="76px"
                    className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
