'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type CategorySlide = {
  title: string;
  path: string;
  image: string;
};

export default function CategorySlider({ categories }: { categories: CategorySlide[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateControls = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    setCanScrollBack(slider.scrollLeft > 0);
    setCanScrollForward(slider.scrollLeft + slider.clientWidth < slider.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    updateControls();
    const resizeObserver = new ResizeObserver(updateControls);
    resizeObserver.observe(slider);
    return () => resizeObserver.disconnect();
  }, [updateControls, categories.length]);

  function scroll(direction: -1 | 1) {
    const slider = sliderRef.current;
    if (!slider) return;

    slider.scrollBy({ left: direction * slider.clientWidth * 0.8, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div
        ref={sliderRef}
        onScroll={updateControls}
        className="scrollbar-hidden flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 sm:gap-4"
        aria-label="Browse categories"
      >
        {categories.map((category, i) => (
          <div
            key={category.path}
            className="w-[42%] min-w-[145px] max-w-[220px] flex-none snap-start sm:w-[28%] lg:w-[18%]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Link href={category.path} className="cat-card group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-[#dde8d6] to-[#c8d9bc] shadow-[0_6px_22px_rgba(23,44,39,0.10)]">
                <Image
                  src={category.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw"
                  className="object-cover transition-transform duration-600 group-hover:scale-[1.07]"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f1b]/80 via-[#17211f]/10 to-transparent" />
                {/* Hover glow ring */}
                <div className="absolute inset-0 rounded-2xl ring-0 ring-[#c6f36b]/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-[#c6f36b]/60" />
                {/* Bottom labels */}
                <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white sm:inset-x-4 sm:bottom-4">
                  <span className="text-[13px] font-bold leading-tight sm:text-[15px]">
                    {category.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-sm backdrop-blur-sm transition-all duration-300 group-hover:border-[#c6f36b] group-hover:bg-[#c6f36b] group-hover:text-[#17211f] group-hover:shadow-[0_0_14px_rgba(198,243,107,0.5)]"
                  >
                    ↗
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Scroll arrows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between sm:flex">
        <button
          type="button"
          aria-label="Previous categories"
          disabled={!canScrollBack}
          onClick={() => scroll(-1)}
          className="pointer-events-auto -ml-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e4d0] bg-white/90 text-[#17211f] shadow-[0_4px_18px_rgba(23,44,39,0.12)] backdrop-blur-sm transition-all hover:scale-105 hover:border-[#c6f36b] hover:shadow-[0_4px_18px_rgba(198,243,107,0.3)] disabled:pointer-events-none disabled:opacity-0"
        >
          <span aria-hidden="true" className="text-lg font-bold">←</span>
        </button>
        <button
          type="button"
          aria-label="Next categories"
          disabled={!canScrollForward}
          onClick={() => scroll(1)}
          className="pointer-events-auto -mr-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e4d0] bg-white/90 text-[#17211f] shadow-[0_4px_18px_rgba(23,44,39,0.12)] backdrop-blur-sm transition-all hover:scale-105 hover:border-[#c6f36b] hover:shadow-[0_4px_18px_rgba(198,243,107,0.3)] disabled:pointer-events-none disabled:opacity-0"
        >
          <span aria-hidden="true" className="text-lg font-bold">→</span>
        </button>
      </div>
    </div>
  );
}
