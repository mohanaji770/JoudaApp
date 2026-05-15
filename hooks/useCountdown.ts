import { useState, useEffect, useCallback } from 'react';

interface UseCountdownOptions {
  initialSeconds: number;
  onComplete?: () => void;
}

export function useCountdown({ initialSeconds, onComplete }: UseCountdownOptions) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    if (seconds <= 0) {
      setIsRunning(false);
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, seconds, onComplete]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

  return { seconds, minutes, remainingSeconds, formatted, isRunning, start, stop, reset };
}
