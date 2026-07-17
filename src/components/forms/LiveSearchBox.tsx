import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Search, ArrowRight } from "lucide-react";
import { SearchBox } from "./SearchBox";
import { useDebounce } from "@/hooks/useDebounce";
import { productFilterQuery } from "@/queries";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";

type LiveSearchBoxProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  containerClassName?: string;
  onSubmit?: () => void;
};

export function LiveSearchBox({ value, onChange, onClear, containerClassName, onSubmit }: LiveSearchBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(value, 300);

  const { data, isFetching } = useQuery({
    ...productFilterQuery({ keyword: debouncedQuery, size: 5 }),
    enabled: debouncedQuery.length > 1 && isOpen,
  });

  const products = data?.content || [];

  useEffect(() => {
    if (value.length > 1) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || products.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < products.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < products.length) {
        e.preventDefault();
        const product = products[activeIndex];
        setIsOpen(false);
        navigate({ to: "/products/$id", params: { id: product.productId } });
      } else {
        setIsOpen(false);
        if (onSubmit) {
          // Normal form submission
          onSubmit();
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", containerClassName)}>
      <SearchBox
        value={value}
        onChange={onChange}
        onClear={onClear}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.length > 1) setIsOpen(true);
        }}
        containerClassName="w-full"
      />

      {isOpen && value.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border bg-background shadow-lg overflow-hidden flex flex-col">
          {isFetching ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : products.length > 0 ? (
            <div className="flex flex-col max-h-[60vh] overflow-y-auto scrollbar-custom">
              {products.map((product, index) => (
                <Link
                  key={product.productId}
                  to="/products/$id"
                  params={{ id: product.productId }}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 border-b last:border-b-0",
                    index === activeIndex ? "bg-muted" : ""
                  )}
                >
                  <div className="h-12 w-12 shrink-0 rounded-md border bg-white p-1 flex items-center justify-center">
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Search className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{product.productName}</p>
                    <p className="text-xs text-muted-foreground truncate">{product.brandName || "Unknown Brand"}</p>
                  </div>
                  <div className="shrink-0 text-right flex flex-col items-end">
                    {(product.exchangeDiscount ?? 0) > 0 ? (
                      <>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Price value={Math.max(0, product.productPrice - (product.exchangeDiscount || 0))} size="sm" className="font-semibold" />
                          <span className="text-[9px] bg-success/10 text-success px-1 py-0.5 rounded border border-success/20">Exch</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground line-through decoration-muted-foreground/50">
                          ₹{product.productPrice.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <Price value={product.productPrice} size="sm" className="font-semibold" />
                    )}
                  </div>
                </Link>
              ))}
              <div 
                className="p-3 bg-muted/30 border-t flex justify-center items-center hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  if (onSubmit) onSubmit();
                }}
              >
                <span className="text-sm font-medium text-brand flex items-center">
                  View all results for "{value}"
                  <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No results found for "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
