import { isBrowser } from "@/lib/utils/env";

type CookieOptions = {
  days?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
};

export const cookies = {
  get(name: string): string | null {
    if (!isBrowser) return null;
    const target = `${name}=`;
    const parts = document.cookie.split(";");
    for (const raw of parts) {
      const c = raw.trim();
      if (c.startsWith(target)) return decodeURIComponent(c.slice(target.length));
    }
    return null;
  },
  set(name: string, value: string, opts: CookieOptions = {}): void {
    if (!isBrowser) return;
    const { days = 7, path = "/", sameSite = "Lax", secure = true } = opts;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    let cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=${sameSite}`;
    if (secure) cookie += "; Secure";
    document.cookie = cookie;
  },
  remove(name: string, path = "/"): void {
    if (!isBrowser) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  },
};
