import { forwardRef, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void;
  containerClassName?: string;
};

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { onClear, value, className, containerClassName, placeholder = "Search batteries, brands, vehicles…", ...rest },
  ref,
) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        className={cn("h-10 pl-10 pr-10", className)}
        {...rest}
      />
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
});
