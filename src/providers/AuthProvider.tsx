import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tokenStore } from "@/lib/auth/tokenStore";
import { decodeJwt, isJwtExpired } from "@/lib/auth/jwt";
import { ROLES, type Role } from "@/constants/roles";
import { isBrowser } from "@/lib/utils/env";
import { refreshAccessTokenSilently } from "@/lib/api/client";

export type AuthUser = {
  id: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  roles: Role[];
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  setSession: (token: string, refreshToken?: string, user?: AuthUser | null) => void;
  signOut: () => void;
  hasRole: (role: Role) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY = "bm.auth.user";

function userFromToken(token: string, fallbackId?: string): AuthUser | null {
  const p = decodeJwt(token);
  if (!p) return fallbackId ? { id: fallbackId, roles: [] } : null;

  const rawRoles =
    (p.roles as string[] | undefined) ??
    (p.authorities as string[] | undefined) ??
    (typeof p.role === "string" ? [p.role as string] : []);

  const roles = rawRoles
    .map((r) => r.replace(/^ROLE_/, "").toUpperCase())
    .filter((r): r is Role => (Object.values(ROLES) as string[]).includes(r));

  return {
    id: String(p.sub ?? fallbackId ?? ""),
    username: typeof p.username === "string" ? p.username : undefined,
    email: typeof p.email === "string" ? p.email : undefined,
    roles,
  };
}

import { cookies } from "@/lib/storage/cookies";

function readStoredUser(): AuthUser | null {
  try {
    const raw = cookies.get(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  try {
    if (user) cookies.set(USER_KEY, JSON.stringify(user), { days: 7, secure: true, sameSite: "Lax", path: "/" });
    else cookies.remove(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    if (!isBrowser) {
      setStatus("unauthenticated");
      return;
    }

    const initAuth = async () => {
      const existing = tokenStore.get();
      if (existing && !isJwtExpired(existing)) {
        const stored = readStoredUser();
        setToken(existing);
        setUser(stored ?? userFromToken(existing));
        setStatus("authenticated");
      } else if (tokenStore.getRefresh()) {
        // Access token expired or missing, but refresh token exists: try silent refresh
        const newToken = await refreshAccessTokenSilently();
        if (newToken) {
          const stored = readStoredUser();
          setToken(newToken);
          setUser(stored ?? userFromToken(newToken));
          setStatus("authenticated");
        } else {
          writeStoredUser(null);
          setStatus("unauthenticated");
        }
      } else {
        if (existing) tokenStore.clear();
        writeStoredUser(null);
        setStatus("unauthenticated");
      }
    };

    void initAuth();
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    writeStoredUser(null);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // Periodic Silent Heartbeat Refresh (Every 5 minutes) + Tab Focus Check
  useEffect(() => {
    if (!isBrowser || status !== "authenticated") return;

    const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const checkAndRefresh = async () => {
      const currentToken = tokenStore.get();
      if (!currentToken || isJwtExpired(currentToken)) {
        const newToken = await refreshAccessTokenSilently();
        if (newToken) {
          setToken(newToken);
          const resolved = readStoredUser() ?? userFromToken(newToken);
          setUser(resolved);
        } else {
          signOut();
        }
      } else {
        const payload = decodeJwt(currentToken);
        // Proactively refresh if token has less than 10 mins remaining
        if (payload?.exp && payload.exp * 1000 - Date.now() < 10 * 60 * 1000) {
          const newToken = await refreshAccessTokenSilently();
          if (newToken) {
            setToken(newToken);
          }
        }
      }
    };

    const interval = setInterval(checkAndRefresh, HEARTBEAT_INTERVAL);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkAndRefresh();
      }
    };

    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
    };
  }, [status, signOut]);

  const setSession = useCallback((newToken: string, newRefreshToken?: string, newUser?: AuthUser | null) => {
    tokenStore.set(newToken);
    if (newRefreshToken) tokenStore.setRefresh(newRefreshToken);
    const resolved = newUser ?? userFromToken(newToken);
    writeStoredUser(resolved);
    setToken(newToken);
    setUser(resolved);
    setStatus("authenticated");
  }, []);



  const hasRole = useCallback((role: Role) => !!user?.roles.includes(role), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, setSession, signOut, hasRole }),
    [status, user, token, setSession, signOut, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
