'use client';

import { useState, useEffect } from 'react';

/**
 * Returns a real-time greeting string based on the current hour of the day.
 * - 05:00 - 11:59: GOOD MORNING
 * - 12:00 - 16:59: GOOD AFTERNOON
 * - 17:00 - 04:59: GOOD EVENING
 */
export function getRealtimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'GOOD MORNING';
  } else if (hour >= 12 && hour < 17) {
    return 'GOOD AFTERNOON';
  } else {
    return 'GOOD EVENING';
  }
}

/**
 * Hook that returns the real-time greeting for the current user's local time.
 * Handles client-side rendering safely and auto-updates every minute.
 */
export function useRealtimeGreeting(): string {
  const [greeting, setGreeting] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getRealtimeGreeting();
    }
    return 'GOOD MORNING';
  });

  useEffect(() => {
    setGreeting(getRealtimeGreeting());

    const interval = setInterval(() => {
      setGreeting(getRealtimeGreeting());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return greeting;
}
