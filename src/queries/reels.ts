import { queryOptions } from "@tanstack/react-query";
import { reelsService } from "@/services/reels.service";

export const reelsKeys = {
  all: ["reels"] as const,
  active: () => [...reelsKeys.all, "active"] as const,
  admin: () => ["admin", "reels"] as const,
};

export const activeReelsQuery = () =>
  queryOptions({
    queryKey: reelsKeys.active(),
    queryFn: ({ signal }) => reelsService.active(signal),
    staleTime: 5 * 60_000,
  });

export const adminReelsQuery = () =>
  queryOptions({
    queryKey: reelsKeys.admin(),
    queryFn: () => reelsService.getAll(),
    staleTime: 60_000,
  });
