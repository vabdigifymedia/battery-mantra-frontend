import { env, isBrowser } from "@/lib/utils/env";
import { tokenStore } from "@/lib/auth/tokenStore";
import type { RequestOptions } from "@/types/api";
import { ApiError, parseApiError } from "./errors";

const DEFAULT_TIMEOUT = 30_000;

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
    throw parseApiError(res.status, data);
  }
  return data as T;
}
