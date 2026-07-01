import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  raw?: unknown;

  constructor(message: string, opts: { status: number; code?: string; fieldErrors?: Record<string, string[]>; raw?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.fieldErrors = opts.fieldErrors;
    this.raw = opts.raw;
  }

  static isApiError(e: unknown): e is ApiError {
    return e instanceof ApiError;
  }
}

export function parseApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const b = body as ApiErrorBody;
    return new ApiError(b.message || b.error || `Request failed (${status})`, {
      status,
      fieldErrors: b.errors,
      raw: body,
    });
  }
  return new ApiError(`Request failed (${status})`, { status, raw: body });
}
