import { useEffect } from 'react';

// Global counter to track how many active modals/components are requesting a scroll lock
let scrollLockCount = 0;

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    scrollLockCount++;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Only apply the lock if this is the first component requesting it
    if (scrollLockCount === 1) {
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    // Prevent touch move on mobile
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Allow scrolling inside elements with scroll
      const scrollableParent = target.closest('.overflow-y-auto, .overflow-auto, .scroll-smooth');
      if (!scrollableParent) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      scrollLockCount = Math.max(0, scrollLockCount - 1);

      // Only unlock if no other components are requesting a lock
      if (scrollLockCount === 0) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
      
      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, [isLocked]);
}
