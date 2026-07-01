import { isBrowser } from "@/lib/utils/env";

const KEY = "bm.auth.token";

/** SSR-safe JWT storage. */
export const tokenStore = {
  get(): string | null {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
