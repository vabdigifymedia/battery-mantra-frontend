import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
  disableNewlines?: boolean;
}

export const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(
  (
    {
      className,
      minRows = 1,
      maxRows = 12,
      disableNewlines = false,
      onChange,
      onInput,
      onKeyDown,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const resize = React.useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;

      // Reset height to calculate actual scrollHeight
      el.style.height = "auto";

      const computed = window.getComputedStyle(el);
      const lineHeight = parseFloat(computed.lineHeight) || 20;
      const paddingTop = parseFloat(computed.paddingTop) || 6;
      const paddingBottom = parseFloat(computed.paddingBottom) || 6;
      const borderTop = parseFloat(computed.borderTopWidth) || 1;
      const borderBottom = parseFloat(computed.borderBottomWidth) || 1;
      const verticalPadding = paddingTop + paddingBottom + borderTop + borderBottom;

      const minHeight = minRows * lineHeight + verticalPadding;
      const maxHeight = maxRows * lineHeight + verticalPadding;

      const newHeight = Math.max(minHeight, Math.min(el.scrollHeight, maxHeight));
      el.style.height = `${newHeight}px`;

      if (el.scrollHeight > maxHeight) {
        el.style.overflowY = "auto";
      } else {
        el.style.overflowY = "hidden";
      }
    }, [minRows, maxRows]);

    React.useEffect(() => {
      resize();
    }, [value, defaultValue, resize]);

    // Resize on window resize as container width changes
    React.useEffect(() => {
      const handleWindowResize = () => resize();
      window.addEventListener("resize", handleWindowResize);
      return () => window.removeEventListener("resize", handleWindowResize);
    }, [resize]);

    return (
      <textarea
        ref={(node) => {
          textareaRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }
        }}
        rows={minRows}
        value={value}
        defaultValue={defaultValue}
        onInput={(e) => {
          resize();
          onInput?.(e);
        }}
        onChange={(e) => {
          resize();
          onChange?.(e);
        }}
        onKeyDown={(e) => {
          if (disableNewlines && e.key === "Enter") {
            e.preventDefault();
            const targetForm = e.currentTarget.form;
            if (targetForm) {
              targetForm.requestSubmit?.();
            }
          }
          onKeyDown?.(e);
        }}
        className={cn(
          "flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none leading-normal",
          minRows === 1 ? "min-h-[38px]" : "min-h-[60px]",
          className
        )}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";
