import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface UnderlineTabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  icon?: ReactNode;
  badge?: number;
  badgeClassName?: string;
  className?: string;
}

interface UnderlineTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  items: UnderlineTabItem<T>[];
  className?: string;
}

/**
 * Clean bottom-border tab bar for primary views or status switching.
 */
export function UnderlineTabs<T extends string>({
  value,
  onValueChange,
  items,
  className,
}: UnderlineTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative -mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer",
              isActive
                ? "border-primary font-semibold text-foreground"
                : "border-transparent font-medium text-muted-foreground hover:border-border hover:text-foreground",
              item.className,
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums leading-none",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {item.count}
              </span>
            )}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white",
                  item.badgeClassName || "bg-primary",
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface FilterComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  label: string;
  allValue?: string;
  allLabel?: string;
  allCount?: number;
  searchPlaceholder?: string;
  emptyText?: string;
  icon?: ReactNode;
  className?: string;
  popoverClassName?: string;
}

/**
 * Searchable dropdown filter with optional item counts and active visual state.
 */
export function FilterCombobox({
  value,
  onValueChange,
  options,
  label,
  allValue = "ALL",
  allLabel = "All",
  allCount,
  searchPlaceholder,
  emptyText = "No matching options.",
  icon,
  className,
  popoverClassName,
}: FilterComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );
  const isFiltered = value !== allValue && Boolean(selectedOption);
  const displayValue = isFiltered ? selectedOption!.label : allLabel;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 justify-between gap-2 px-3 text-xs font-medium max-w-[260px]",
            isFiltered && "border-primary/40 bg-primary/5 text-foreground hover:bg-primary/10",
            className,
          )}
        >
          <span className="flex items-center gap-1.5 truncate">
            {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
            <span className="text-muted-foreground font-normal shrink-0">{label}:</span>
            <span className="truncate font-semibold">{displayValue}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[280px] sm:w-[320px] p-0", popoverClassName)}>
        <Command>
          <CommandInput placeholder={searchPlaceholder || `Search ${label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={`${allLabel} ${allValue}`}
                onSelect={() => {
                  onValueChange(allValue);
                  setOpen(false);
                }}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex items-center gap-2 truncate">
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      value === allValue ? "opacity-100 text-primary" : "opacity-0",
                    )}
                  />
                  <span className="font-medium truncate">{allLabel}</span>
                </span>
                {allCount !== undefined && (
                  <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                    {allCount}
                  </span>
                )}
              </CommandItem>

              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <CommandItem
                    key={opt.value}
                    value={`${opt.label} ${opt.value}`}
                    onSelect={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isSelected ? "opacity-100 text-primary" : "opacity-0",
                        )}
                      />
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {opt.count !== undefined && (
                      <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                        {opt.count}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export interface ActiveFilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterSummaryBarProps {
  chips: ActiveFilterChip[];
  onClearAll?: () => void;
  showingCount: number;
  totalCount?: number;
  itemLabel?: string;
  className?: string;
}

/**
 * Displays active removable filter chips alongside result counts.
 */
export function FilterSummaryBar({
  chips,
  onClearAll,
  showingCount,
  totalCount,
  itemLabel = "items",
  className,
}: FilterSummaryBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <Badge
            key={chip.key}
            variant="secondary"
            className="gap-1 pl-2.5 pr-1 py-0.5 text-xs font-normal"
          >
            <span className="text-muted-foreground">{chip.label}:</span>
            <span className="font-medium text-foreground max-w-[180px] truncate">
              {chip.value}
            </span>
            <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove ${chip.label} filter`}
              className="ml-0.5 rounded-full p-0.5 hover:bg-background/80 hover:text-foreground cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {chips.length > 1 && onClearAll && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <span className="ml-auto tabular-nums">
        Showing <strong className="text-foreground">{showingCount}</strong>
        {totalCount !== undefined && totalCount !== showingCount && (
          <>
            {" "}
            of <strong className="text-foreground">{totalCount}</strong>
          </>
        )}{" "}
        {itemLabel}
      </span>
    </div>
  );
}

