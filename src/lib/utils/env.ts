/**
 * Typed access to import.meta.env.
 * Only VITE_-prefixed vars are exposed to the client.
 */
type ClientEnv = {
  API_BASE_URL: string;
  APP_ENV: "development" | "production" | "test";
  RAZORPAY_KEY_ID: string;
  GOOGLE_MAPS_API_KEY: string;
};

const raw = import.meta.env as Record<string, string | undefined>;

export const env: ClientEnv = {
  API_BASE_URL: raw.VITE_API_BASE_URL ?? "",
  APP_ENV: (raw.MODE as ClientEnv["APP_ENV"]) ?? "development",
  RAZORPAY_KEY_ID: raw.VITE_RAZORPAY_KEY_ID ?? "",
  GOOGLE_MAPS_API_KEY: raw.VITE_GOOGLE_MAPS_API_KEY ?? "",
};

export const isBrowser = typeof window !== "undefined";
export const isDev = env.APP_ENV !== "production";
