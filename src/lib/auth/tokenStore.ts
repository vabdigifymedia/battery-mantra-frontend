import { cookies } from "@/lib/storage/cookies";

const KEY = "bm.auth.token";
const REFRESH_KEY = "bm.auth.refresh";

/** SSR-safe JWT storage using Cookies. */
export const tokenStore = {
  get(): string | null {
    return cookies.get(KEY);
  },
  set(token: string): void {
    // Save tokens securely for 7 days
    cookies.set(KEY, token, { days: 7, secure: true, sameSite: "Lax", path: "/" });
  },
  clear(): void {
    cookies.remove(KEY);
    cookies.remove(REFRESH_KEY);
  },
  getRefresh(): string | null {
    return cookies.get(REFRESH_KEY);
  },
  setRefresh(token: string): void {
    cookies.set(REFRESH_KEY, token, { days: 30, secure: true, sameSite: "Lax", path: "/" });
  },
};

