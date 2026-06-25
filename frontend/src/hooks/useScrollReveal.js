/**
 * useScrollReveal.js
 * 
 * Drop-in React hook — uses Intersection Observer API.
 * NO scroll event listeners. GPU-friendly. Zero dependencies.
 * 
 * HOW TO USE IN ANY COMPONENT:
 * 
 *   import useScrollReveal from '../hooks/useScrollReveal';
 * 
 *   function MyComponent() {
 *     useScrollReveal(); // ← one line, that's it
 *     return (
 *       <div className="reveal">I fade in on scroll</div>
 *       <div className="stagger-grid">
 *         <div>Card 1</div>  ← auto staggered
 *         <div>Card 2</div>
 *         <div>Card 3</div>
 *       </div>
 *     );
 *   }
 */
import { useEffect } from 'react';

const useScrollReveal = (options = {}, deps = []) => {
  useEffect(() => {
    // Respect user's accessibility preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const config = {
      // Element must be 12% visible before triggering
      threshold:  options.threshold  ?? 0.12,
      // Trigger slightly before element enters viewport
      rootMargin: options.rootMargin ?? '0px 0px -40px 0px',
    };

    // ── Individual reveal elements ──────────────────────────
    const revealSelectors = [
      '.reveal',
      '.reveal-left',
      '.reveal-right',
      '.reveal-scale',
      '.reveal-heading',
      '.reveal-section',
    ].join(', ');

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Unobserve after animation — no wasted observer calls
          revealObserver.unobserve(entry.target);
        }
      });
    }, config);

    // ── Stagger grid parents ────────────────────────────────
    // Observe the PARENT, not each child individually
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          staggerObserver.unobserve(entry.target);
        }
      });
    }, {
      ...config,
      threshold: 0.08, // Grids trigger earlier
    });

    // Observe all matching elements
    const revealEls  = document.querySelectorAll(revealSelectors);
    const staggerEls = document.querySelectorAll('.stagger-grid');

    // Fix #4: if an element is already above (or within) the viewport when the
    // observer is (re)built, IntersectionObserver fires isIntersecting: false and
    // the element stays at opacity:0 permanently. Detect and mark immediately.
    const alreadyVisible = (el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight; // in viewport
    };
    const alreadyAbove = (el) => el.getBoundingClientRect().bottom < 0;

    revealEls.forEach(el => {
      if (alreadyVisible(el) || alreadyAbove(el)) {
        el.classList.add('is-visible');
      } else {
        revealObserver.observe(el);
      }
    });
    staggerEls.forEach(el => {
      if (alreadyVisible(el) || alreadyAbove(el)) {
        el.classList.add('is-visible');
      } else {
        staggerObserver.observe(el);
      }
    });

    // Cleanup on component unmount
    return () => {
      revealObserver.disconnect();
      staggerObserver.disconnect();
    };
  }, [options.threshold, options.rootMargin, ...deps]);
};

export default useScrollReveal;