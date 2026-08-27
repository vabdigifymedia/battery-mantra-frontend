import { useState, useRef, useEffect, KeyboardEvent, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Search, ArrowRight, Layers, Bookmark, Factory, Car } from "lucide-react";
import { SearchBox } from "./SearchBox";
import { useDebounce } from "@/hooks/useDebounce";
import { productFilterQuery, brandsQuery, rootCategoriesQuery, manufacturersListQuery, vehiclesListQuery } from "@/queries";
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

  const { data: categories } = useQuery(rootCategoriesQuery());
  const { data: brands } = useQuery(brandsQuery());
  const { data: manufacturers } = useQuery(manufacturersListQuery());
  const { data: vehicles } = useQuery(vehiclesListQuery());

  const products = data?.content || [];
  const q = debouncedQuery.toLowerCase();
  
  const matchedCategories = useMemo(() => {
    return q.length > 1 && categories ? categories.filter((c: any) => c.categoryName.toLowerCase().includes(q)).slice(0, 2) : [];
  }, [q, categories]);

  const matchedBrands = useMemo(() => {
    return q.length > 1 && brands ? brands.filter((b: any) => b.brandName.toLowerCase().includes(q)).slice(0, 3) : [];
  }, [q, brands]);

  const matchedManufacturers = useMemo(() => {
    return q.length > 1 && manufacturers ? manufacturers.filter((m: any) => m.name.toLowerCase().includes(q)).slice(0, 3) : [];
  }, [q, manufacturers]);

  const matchedVehicles = useMemo(() => {
    if (q.length <= 1 || !vehicles) return [];
    return vehicles.filter((v: any) => {
      const fullName = `${v.make} ${v.model} ${v.fuelName || ''}`.toLowerCase();
      return fullName.includes(q);
    }).slice(0, 4);
  }, [q, vehicles]);

  const hasResults = products.length > 0 || matchedCategories.length > 0 || matchedBrands.length > 0 || matchedManufacturers.length > 0 || matchedVehicles.length > 0;
  
  const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

  const getVehicleCategorySlug = (categoryId?: string) => {
    if (!categoryId || !categories) return "car-battery";
    for (const cat of categories) {
      if (cat.categoryId === categoryId) return toSlug(cat.categoryName);
      if (cat.subCategories) {
        const sub = cat.subCategories.find((s: any) => s.categoryId === categoryId);
        if (sub) return toSlug(sub.categoryName);
      }
    }
    return "car-battery";
  };

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
        navigate({ to: "/product/$slug", params: { slug: product.seo?.slug || product.productId } });
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
          {isFetching && !hasResults ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : hasResults ? (
            <div className="flex flex-col max-h-[70vh] overflow-y-auto scrollbar-custom">
              
              {matchedCategories.length > 0 && (
                <div className="border-b">
                  <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/30 flex items-center">
                    <Layers className="h-3 w-3 mr-1" /> Categories
                  </div>
                  {matchedCategories.map((cat: any) => (
                    <Link
                      key={cat.categoryId}
                      to="/shop/c/$categorySlug"
                      params={{ categorySlug: toSlug(cat.categoryName) }}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 border-b last:border-b-0"
                    >
                      <div className="h-8 w-8 shrink-0 rounded bg-muted/50 p-1 flex items-center justify-center">
                        {cat.iconUrl ? <img src={cat.iconUrl} alt={cat.categoryName} className="h-full w-full object-contain" /> : <Search className="h-4 w-4 text-muted-foreground/50" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{cat.categoryName}</span>
                    </Link>
                  ))}
                </div>
              )}

              {matchedBrands.length > 0 && (
                <div className="border-b">
                  <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/30 flex items-center">
                    <Bookmark className="h-3 w-3 mr-1" /> Brands
                  </div>
                  {matchedBrands.map((brand: any) => (
                    <Link
                      key={brand.brandId}
                      to="/brand/$brandSlug"
                      params={{ brandSlug: toSlug(brand.brandName) }}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 border-b last:border-b-0"
                    >
                      <div className="h-8 w-8 shrink-0 rounded bg-muted/50 p-1 flex items-center justify-center">
                        {brand.brandLogo ? <img src={brand.brandLogo} alt={brand.brandName} className="h-full w-full object-contain" /> : <Search className="h-4 w-4 text-muted-foreground/50" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{brand.brandName}</span>
                    </Link>
                  ))}
                </div>
              )}

              {matchedManufacturers.length > 0 && (
                <div className="border-b">
                  <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/30 flex items-center">
                    <Factory className="h-3 w-3 mr-1" /> Manufacturers
                  </div>
                  {matchedManufacturers.map((man: any) => {
                    const catSlug = man.categories?.[0]?.categoryName ? toSlug(man.categories[0].categoryName) : "car-battery";
                    return (
                      <Link
                        key={man.id}
                        to="/manufacturers/$categorySlug/$makeSlug"
                        params={{ categorySlug: catSlug, makeSlug: toSlug(man.name) }}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 border-b last:border-b-0"
                      >
                        <div className="h-8 w-8 shrink-0 rounded bg-muted/50 p-1 flex items-center justify-center">
                          {man.logoUrl ? <img src={man.logoUrl} alt={man.name} className="h-full w-full object-contain" /> : <Search className="h-4 w-4 text-muted-foreground/50" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{man.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {matchedVehicles.length > 0 && (
                <div className="border-b">
                  <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/30 flex items-center">
                    <Car className="h-3 w-3 mr-1" /> Vehicles
                  </div>
                  {matchedVehicles.map((v: any) => (
                    <Link
                      key={v.vehicleId}
                      to="/manufacturers/$categorySlug/$makeSlug/$modelSlug"
                      params={{ 
                        categorySlug: getVehicleCategorySlug(v.categoryId), 
                        makeSlug: toSlug(v.make), 
                        modelSlug: toSlug(v.model) 
                      }}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 border-b last:border-b-0"
                    >
                      <div className="h-8 w-8 shrink-0 rounded bg-muted/50 p-1 flex items-center justify-center">
                        {v.imageUrl ? <img src={v.imageUrl} alt={`${v.make} ${v.model}`} className="h-full w-full object-contain" /> : <Car className="h-4 w-4 text-muted-foreground/50" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {v.make} {v.model} {v.fuelName ? <span className="text-muted-foreground text-xs ml-1">({v.fuelName})</span> : null}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {products.length > 0 && (
                <div className="border-b last:border-b-0">
                  <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/30 flex items-center">
                    <Search className="h-3 w-3 mr-1" /> Products
                  </div>
                  {products.map((product, index) => (
                    <Link
                      key={product.productId}
                      to="/product/$slug"
                      params={{ slug: product.seo?.slug || product.productId }}
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
                </div>
              )}

              <div 
                className="p-3 bg-muted/30 border-t flex justify-center items-center hover:bg-muted/50 cursor-pointer transition-colors mt-auto"
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
