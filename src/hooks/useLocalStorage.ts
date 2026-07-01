import { useCallback, useEffect, useState } from "react";
import { storage } from "@/lib/storage/localStorage";
import { isBrowser } from "@/lib/utils/env";

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    if (!isBrowser) return;
    const stored = storage.get<T>(key);
    if (stored !== null) setValue(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        storage.set(key, next);
        return next;
      });
    },
    [key],
  );

  const remove = useCallback(() => {
    storage.remove(key);
    setValue(initial);
  }, [key, initial]);

  return [value, update, remove];
}
