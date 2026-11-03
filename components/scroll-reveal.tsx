'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add('js-loaded');

    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!els.length) return;

    // Immediately reveal elements that are already in the viewport —
    // no waiting for the observer tick, eliminates the flash of invisible content.
    els.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible');
      }
    });

    // Watch remaining elements as the user scrolls
    const remaining = els.filter((el) => !el.classList.contains('visible'));
    if (!remaining.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    remaining.forEach((el) => io.observe(el));

    // Safety net: reveal everything after 800ms in case observer misses anything
    const timer = setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.visible)').forEach((el) => {
        el.classList.add('visible');
      });
    }, 800);

    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
