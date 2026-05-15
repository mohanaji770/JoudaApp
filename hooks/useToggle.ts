import { useState, useCallback } from 'react';

interface UseToggleOptions {
  initial?: boolean;
}

export function useToggle({ initial = false }: UseToggleOptions = {}) {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse, setValue };
}
