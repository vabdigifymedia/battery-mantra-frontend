import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { RequestOptions } from "@/types/api";
import type { ApiError } from "@/lib/api/errors";

/**
 * Thin wrappers around TanStack Query that bind to the project's apiFetch.
 * Endpoints aren't created here — pass a path + options when calling.
 */
export function useApiQuery<TData>(
  key: readonly unknown[],
  path: string,
  options?: Omit<RequestOptions, "signal"> & { query?: UseQueryOptions<TData, ApiError>["enabled"] extends boolean ? Record<string, unknown> : never },
  queryOptions?: Omit<UseQueryOptions<TData, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<TData, ApiError>({
    queryKey: key,
    queryFn: ({ signal }) => apiFetch<TData>(path, { ...options, signal }),
    ...queryOptions,
  });
}

export function useApiMutation<TData, TVars = void>(
  path: string | ((vars: TVars) => string),
  options?: Omit<RequestOptions, "body" | "signal"> & { method?: RequestOptions["method"] },
  mutationOptions?: Omit<UseMutationOptions<TData, ApiError, TVars>, "mutationFn">,
) {
  return useMutation<TData, ApiError, TVars>({
    mutationFn: (vars) => {
      const resolved = typeof path === "function" ? path(vars) : path;
      return apiFetch<TData>(resolved, {
        method: options?.method ?? "POST",
        ...options,
        body: vars,
      });
    },
    ...mutationOptions,
  });
}
