'use client';

import ProductCard from 'components/product-card';
import type { Product } from 'lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function ProductSlider({ products, title }: { products: Product[]; title: string }) {
  const sliderRef = useRef<HTMLUListElement>(null);
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
  }, [updateControls, products.length]);

  function scroll(direction: -1 | 1) {
    const slider = sliderRef.current;
    if (!slider) return;

    slider.scrollBy({ left: direction * slider.clientWidth * 0.8, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <ul
        ref={sliderRef}
        onScroll={updateControls}
        aria-label={title}
        className="scrollbar-hidden flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 sm:gap-5"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[72%] min-w-[230px] max-w-[320px] flex-none snap-start sm:w-[42%] lg:w-[24%]"
          >
            <ProductCard product={product} showActions />
          </li>
        ))}
      </ul>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between sm:flex">
        <button
          type="button"
          aria-label={`Previous ${title.toLowerCase()}`}
          disabled={!canScrollBack}
          onClick={() => scroll(-1)}
          className="pointer-events-auto -ml-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e4d0] bg-white/90 text-[#17211f] shadow-[0_4px_18px_rgba(23,44,39,0.12)] backdrop-blur-sm transition-all hover:scale-105 hover:border-[#c6f36b] hover:shadow-[0_4px_18px_rgba(198,243,107,0.3)] disabled:pointer-events-none disabled:opacity-0"
        >
          <span aria-hidden="true" className="text-lg font-bold">←</span>
        </button>
        <button
          type="button"
          aria-label={`Next ${title.toLowerCase()}`}
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
