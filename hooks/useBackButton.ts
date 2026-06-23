import { useEffect } from 'react';

type BackHandler = () => void;
const backHandlers: BackHandler[] = [];

/**
 * Executes the most recently registered back button handler (LIFO).
 * Returns true if a handler was executed, false otherwise.
 */
export const handleBackButton = (): boolean => {
  if (backHandlers.length > 0) {
    const lastHandler = backHandlers[backHandlers.length - 1];
    lastHandler();
    return true;
  }
  return false;
};

/**
 * Hook to register a back button handler when the component/overlay is active.
 * Automatically handles cleanup when deactivated or unmounted.
 */
export const useBackButton = (active: boolean, handler: BackHandler) => {
  useEffect(() => {
    if (!active) return;

    backHandlers.push(handler);

    return () => {
      const index = backHandlers.indexOf(handler);
      if (index !== -1) {
        backHandlers.splice(index, 1);
      }
    };
  }, [active, handler]);
};
