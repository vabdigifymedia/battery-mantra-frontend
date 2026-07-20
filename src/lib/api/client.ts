import { env, isBrowser } from "@/lib/utils/env";
import { tokenStore } from "@/lib/auth/tokenStore";
import type { RequestOptions } from "@/types/api";
import { ApiError, parseApiError } from "./errors";

const DEFAULT_TIMEOUT = 30_000;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = env.API_BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${p}`;
  if (!query) return url;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    usp.append(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Universal fetch wrapper. SSR-safe.
 * - Attaches JWT from tokenStore on the client (auth: true default).
 * - Normalizes errors to ApiError.
 * - Supports timeout via AbortController.
 */
export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    headers = {},
    signal,
    auth = true,
    timeout = DEFAULT_TIMEOUT,
    multipart = false,
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (multipart || body instanceof FormData) {
      payload = body as FormData;
    } else {
      finalHeaders["Content-Type"] = finalHeaders["Content-Type"] ?? "application/json";
      payload = JSON.stringify(body);
    }
  }

  if (auth && isBrowser) {
    const token = tokenStore.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: payload,
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === "AbortError") {
      throw new ApiError("Request timed out", { status: 0, code: "TIMEOUT" });
    }
    throw new ApiError("Network error", { status: 0, code: "NETWORK", raw: e });
  }
  clearTimeout(timer);

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data: unknown = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    if (auth && (res.status === 401 || res.status === 403) && isBrowser) {
      const refreshToken = tokenStore.getRefresh();
      
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const base = env.API_BASE_URL.replace(/\/$/, "");
            const refreshRes = await fetch(`${base}/api/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });
            
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              tokenStore.set(refreshData.token);
              if (refreshData.refreshToken) {
                tokenStore.setRefresh(refreshData.refreshToken);
              }
              onRefreshed(refreshData.token);
              
              // Retry original request
              finalHeaders.Authorization = `Bearer ${refreshData.token}`;
              const retryRes = await fetch(buildUrl(path, query), {
                method,
                headers: finalHeaders,
                body: payload,
                signal: controller.signal,
                credentials: "omit",
              });
              const retryContentType = retryRes.headers.get("content-type") ?? "";
              const retryData: unknown = retryContentType.includes("application/json") 
                ? await retryRes.json().catch(() => null) 
                : await retryRes.text().catch(() => null);
              
              if (!retryRes.ok) throw parseApiError(retryRes.status, retryData);
              return retryData as T;
            } else {
              throw new Error("Refresh failed");
            }
          } catch (err) {
            tokenStore.clear();
            onRefreshed(""); // Flush queue, they will fail
            if (!window.location.pathname.includes("/login")) {
              window.location.href = "/login";
            }
            throw parseApiError(res.status, data);
          } finally {
            isRefreshing = false;
          }
        } else {
          return new Promise<T>((resolve, reject) => {
            addRefreshSubscriber((newToken) => {
              if (!newToken) {
                reject(parseApiError(res.status, data));
                return;
              }
              finalHeaders.Authorization = `Bearer ${newToken}`;
              fetch(buildUrl(path, query), {
                method,
                headers: finalHeaders,
                body: payload,
                signal: controller.signal,
                credentials: "omit",
              }).then(async retryRes => {
                const retryContentType = retryRes.headers.get("content-type") ?? "";
                const retryData: unknown = retryContentType.includes("application/json") 
                  ? await retryRes.json().catch(() => null) 
                  : await retryRes.text().catch(() => null);
                if (!retryRes.ok) reject(parseApiError(retryRes.status, retryData));
                else resolve(retryData as T);
              }).catch(err => reject(new ApiError("Network error", { status: 0, code: "NETWORK", raw: err })));
            });
          });
        }
      } else {
        tokenStore.clear();
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    throw parseApiError(res.status, data);
  }
  return data as T;
}
