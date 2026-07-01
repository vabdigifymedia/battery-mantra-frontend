import { useCallback, useMemo, useState } from "react";

/** Stack-based loading counter so concurrent operations don't race. */
export function useLoading(initial = false) {
  const [count, setCount] = useState(initial ? 1 : 0);
  const start = useCallback(() => setCount((c) => c + 1), []);
  const stop = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);
  const reset = useCallback(() => setCount(0), []);
  return useMemo(() => ({ isLoading: count > 0, start, stop, reset }), [count, start, stop, reset]);
}
