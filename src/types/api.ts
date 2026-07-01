export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type Paginated<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ApiErrorBody = {
  message?: string;
  error?: string;
  status?: number;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
};

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip Authorization header. Default false. */
  auth?: boolean;
  /** Timeout in ms. Default 30000. */
  timeout?: number;
  /** Pass FormData directly; sets multipart automatically. */
  multipart?: boolean;
};
