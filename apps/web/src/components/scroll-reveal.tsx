import { useEffect } from 'react';

// Reveals any element with the `reveal` class as it scrolls into view.
// A single IntersectionObserver serves the whole app; a MutationObserver picks
// up elements added on route changes. Respects prefers-reduced-motion.
export const ScrollReveal = () => {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supported = 'IntersectionObserver' in window;

    const revealAll = () =>
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => el.classList.add('is-visible'));

    if (reduceMotion || !supported) {
      revealAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    let frame = 0;
    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
      });
    };

    scan();

    // Catch elements added by client-side navigation.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: reveal anything still hidden after load.
    const fallback = window.setTimeout(revealAll, 2500);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
};
