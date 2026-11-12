import { useCallback, useEffect, useRef, useState } from 'react';

export type SavedPage = {
  id: string;
  title: string;
  url: string;
  savedAt: number;
};

export type Theme = 'system' | 'light' | 'dark';
export type PanelWidth = 'standard' | 'wide';

export type Settings = {
  theme: Theme;
  width: PanelWidth;
  reduceMotion: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  width: 'standard',
  reduceMotion: false,
};

export const STORAGE_KEYS = {
  savedPages: 'sidebar.savedPages',
  settings: 'sidebar.settings',
} as const;

const FALLBACK_EVENT = 'sidebar-storage-change';

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.storage !== 'undefined' &&
    typeof chrome.storage.local !== 'undefined'
  );
}

export async function readStored<T>(key: string, fallback: T): Promise<T> {
  if (hasChromeStorage()) {
    try {
      const result = await chrome.storage.local.get(key);
      return (result[key] as T | undefined) ?? fallback;
    } catch {
      return fallback;
    }
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeStored<T>(key: string, value: T): Promise<void> {
  if (hasChromeStorage()) {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.warn('[sidebar] Could not save to chrome.storage.local.', error);
    }
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(FALLBACK_EVENT, { detail: key }));
  } catch {
    // localStorage can be unavailable in private or sandboxed contexts.
  }
}

export function watchStored<T>(
  key: string,
  onChange: (value: T) => void,
): () => void {
  if (hasChromeStorage()) {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local' || !(key in changes)) return;
      onChange(changes[key].newValue as T);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  const listener = (event: Event) => {
    if ((event as CustomEvent<string>).detail !== key) return;
    void readStored<T | undefined>(key, undefined).then((value) => {
      if (value !== undefined) onChange(value);
    });
  };
  window.addEventListener(FALLBACK_EVENT, listener);
  return () => window.removeEventListener(FALLBACK_EVENT, listener);
}

type SetValue<T> = (next: T | ((previous: T) => T)) => void;

/**
 * Reads a value from extension storage once, keeps it in React state, and
 * writes every update back. Also follows changes made by other tabs.
 */
export function useStoredState<T>(
  key: string,
  initialValue: T,
): readonly [T, SetValue<T>] {
  const [value, setValue] = useState<T>(initialValue);
  const valueRef = useRef<T>(initialValue);
  const initialRef = useRef<T>(initialValue);

  useEffect(() => {
    let active = true;

    void readStored(key, initialRef.current).then((stored) => {
      if (!active) return;
      valueRef.current = stored;
      setValue(stored);
    });

    const stop = watchStored<T>(key, (next) => {
      if (!active || next === undefined) return;
      valueRef.current = next;
      setValue(next);
    });

    return () => {
      active = false;
      stop();
    };
  }, [key]);

  const update = useCallback<SetValue<T>>(
    (next) => {
      const resolved =
        typeof next === 'function'
          ? (next as (previous: T) => T)(valueRef.current)
          : next;
      valueRef.current = resolved;
      setValue(resolved);
      void writeStored(key, resolved);
    },
    [key],
  );

  return [value, update] as const;
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function formatRelative(timestamp: number): string {
  const diff = timestamp - Date.now();
  const absolute = Math.abs(diff);
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (absolute < 60_000) return 'just now';
  if (absolute < 3_600_000) {
    return relative.format(Math.round(diff / 60_000), 'minute');
  }
  if (absolute < 86_400_000) {
    return relative.format(Math.round(diff / 3_600_000), 'hour');
  }
  if (absolute < 604_800_000) {
    return relative.format(Math.round(diff / 86_400_000), 'day');
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
