import { Save, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormDraftBannerProps {
  hasDraft: boolean;
  draftTime?: string | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export function FormDraftBanner({
  hasDraft,
  draftTime,
  onRestore,
  onDiscard,
}: FormDraftBannerProps) {
  if (!hasDraft) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <Save className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Unsaved Draft Recovered</p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            You have an unsaved draft from {draftTime ? `today at ${draftTime}` : "a previous session"}. Would you like to restore it?
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onRestore}
          className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Restore Draft
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDiscard}
          className="gap-1 text-amber-800 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-950 dark:text-amber-300"
        >
          <X className="h-3.5 w-3.5" />
          Discard
        </Button>
      </div>
    </div>
  );
}
