import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Prevent touch move on mobile
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Allow scrolling inside elements with scroll
      const scrollableParent = target.closest('.overflow-y-auto, .overflow-auto');
      if (!scrollableParent) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, [isLocked]);
}
