import { useState } from 'react';

/**
 * Same shape as useState, but the value survives a reload — for UI
 * preferences only (filters, panel position, last screen), never for
 * finance data itself, which always goes through Core/IndexedDB instead.
 * Silently falls back to plain in-memory state if localStorage is
 * unavailable (private browsing, SSR) or the stored value fails to parse.
 */
export function useLocalStorageState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function update(next: T | ((prev: T) => T)) {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage unavailable/full — keep working in-memory for this session.
      }
      return resolved;
    });
  }

  return [value, update];
}
