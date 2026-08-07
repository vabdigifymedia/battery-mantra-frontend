import { useEffect, useState, useCallback } from "react";
import { isBrowser } from "@/lib/utils/env";

export interface DraftInfo<T> {
  data: T;
  updatedAt: string;
}

export function useFormDraft<T extends Record<string, any>>(
  draftKey: string,
  currentValues: T,
  onRestore: (savedData: T) => void,
  enabled = true
) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState<string | null>(null);
  const [savedDraft, setSavedDraft] = useState<T | null>(null);

  const fullKey = `bm.form_draft.${draftKey}`;

  // Check for existing draft on mount
  useEffect(() => {
    if (!isBrowser || !enabled) return;
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw) {
        const parsed: DraftInfo<T> = JSON.parse(raw);
        if (parsed && parsed.data && Object.keys(parsed.data).length > 0) {
          setHasDraft(true);
          setSavedDraft(parsed.data);
          const date = new Date(parsed.updatedAt);
          setDraftTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch {
      /* ignore */
    }
  }, [fullKey, enabled]);

  // Periodically save draft
  useEffect(() => {
    if (!isBrowser || !enabled) return;

    const timer = setInterval(() => {
      try {
        // Only save if currentValues contains non-empty data
        const hasContent = Object.values(currentValues).some(
          (val) => val !== "" && val !== null && val !== undefined && !(Array.isArray(val) && val.length === 0)
        );

        if (hasContent) {
          const draft: DraftInfo<T> = {
            data: currentValues,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(fullKey, JSON.stringify(draft));
        }
      } catch {
        /* ignore */
      }
    }, 3000); // Every 3 seconds

    return () => clearInterval(timer);
  }, [fullKey, currentValues, enabled]);

  const restoreDraft = useCallback(() => {
    if (savedDraft) {
      onRestore(savedDraft);
      setHasDraft(false);
    }
  }, [savedDraft, onRestore]);

  const clearDraft = useCallback(() => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(fullKey);
    } catch {
      /* ignore */
    }
    setHasDraft(false);
    setSavedDraft(null);
  }, [fullKey]);

  return {
    hasDraft,
    draftTime,
    restoreDraft,
    clearDraft,
  };
}
