import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tokenStore } from "@/lib/auth/tokenStore";
import { decodeJwt, isJwtExpired } from "@/lib/auth/jwt";
import { ROLES, type Role } from "@/constants/roles";
import { isBrowser } from "@/lib/utils/env";

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
  setSession: (token: string, user?: AuthUser | null) => void;
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

function readStoredUser(): AuthUser | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  if (!isBrowser) return;
  try {
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(USER_KEY);
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
    const existing = tokenStore.get();
    if (existing && !isJwtExpired(existing)) {
      const stored = readStoredUser();
      setToken(existing);
      setUser(stored ?? userFromToken(existing));
      setStatus("authenticated");
    } else {
      if (existing) tokenStore.clear();
      writeStoredUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const setSession = useCallback((newToken: string, newUser?: AuthUser | null) => {
    tokenStore.set(newToken);
    const resolved = newUser ?? userFromToken(newToken);
    writeStoredUser(resolved);
    setToken(newToken);
    setUser(resolved);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    writeStoredUser(null);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
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
