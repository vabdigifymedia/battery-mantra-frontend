import { useCallback, useMemo, useState } from "react";
import { APP } from "@/constants/app";

type UsePaginationOptions = {
  initialPage?: number;
  initialSize?: number;
  total?: number;
};

export function usePagination({ initialPage = 1, initialSize = APP.defaultPageSize, total = 0 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);

  const totalPages = Math.max(1, Math.ceil(total / size));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const goTo = useCallback((p: number) => setPage(Math.min(Math.max(1, p), totalPages)), [totalPages]);
  const next = useCallback(() => canNext && setPage((p) => p + 1), [canNext]);
  const prev = useCallback(() => canPrev && setPage((p) => p - 1), [canPrev]);
  const reset = useCallback(() => setPage(1), []);

  return useMemo(
    () => ({ page, size, totalPages, canPrev, canNext, setPage: goTo, setSize, next, prev, reset }),
    [page, size, totalPages, canPrev, canNext, goTo, next, prev, reset],
  );
}
