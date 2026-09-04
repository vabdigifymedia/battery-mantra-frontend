import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { productListQuery, rootCategoriesQuery, brandsQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

export const Route = createFileRoute("/admin/products/priority")({
  component: AdminProductPriority,
});

function SortableProductCard({ product }: { product: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.productId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm transition-all ${
        isDragging ? "ring-2 ring-primary opacity-90 scale-105" : "hover:border-primary/50"
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <div className="flex flex-col items-center gap-2 pt-4">
        {product.productImage ? (
          <img src={product.productImage} alt={product.productName} className="h-16 w-16 rounded object-cover border" />
        ) : (
          <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
        )}
        <div className="text-center w-full">
          <h3 className="font-semibold text-sm line-clamp-2" title={product.productName}>{product.productName}</h3>
          <p className="text-xs text-muted-foreground mt-1">{product.brandName || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}

function AdminProductPriority() {
  const queryClient = useQueryClient();
  const { data: allProducts, isLoading: isProductsLoading } = useQuery(productListQuery());
  const { data: categories } = useQuery(rootCategoriesQuery());
  const { data: brands } = useQuery(brandsQuery());
  
  const [activeCategoryId, setActiveCategoryId] = useState<string>("ALL");
  const [activeBrandId, setActiveBrandId] = useState<string>("ALL");
  
  const [items, setItems] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!allProducts) return;
    
    let filtered = [...allProducts];
    
    if (activeCategoryId !== "ALL") {
      const cat = categories?.find(c => c.categoryId === activeCategoryId);
      if (cat) {
        filtered = filtered.filter(p => p.productCategory === cat.categoryName);
      }
    }
    
    if (activeBrandId !== "ALL") {
      const brand = brands?.find(b => b.brandId === activeBrandId);
      if (brand) {
        filtered = filtered.filter(p => p.brandName === brand.brandName);
      }
    }
    
    // Sort by the appropriate display order based on context
    filtered.sort((a, b) => {
      let orderA = a.globalDisplayOrder ?? a.displayOrder ?? 999999;
      let orderB = b.globalDisplayOrder ?? b.displayOrder ?? 999999;
      
      if (activeCategoryId !== "ALL" && activeBrandId !== "ALL") {
        orderA = a.categoryBrandDisplayOrder ?? 999999;
        orderB = b.categoryBrandDisplayOrder ?? 999999;
      } else if (activeCategoryId !== "ALL" && activeBrandId === "ALL") {
        orderA = a.categoryDisplayOrder ?? 999999;
        orderB = b.categoryDisplayOrder ?? 999999;
      } else if (activeBrandId !== "ALL" && activeCategoryId === "ALL") {
        orderA = a.brandDisplayOrder ?? 999999;
        orderB = b.brandDisplayOrder ?? 999999;
      }
      
      return orderA - orderB;
    });
    
    setItems(filtered);
    setHasChanges(false);
  }, [allProducts, activeCategoryId, activeBrandId, categories, brands]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.productId === active.id);
        const newIndex = items.findIndex((item) => item.productId === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const isInvalidMode = false;

  const reorderMutation = useMutation({
    mutationFn: async () => {
      let context: "GLOBAL" | "CATEGORY" | "BRAND" | "CATEGORY_BRAND" = "GLOBAL";
      if (activeCategoryId !== "ALL" && activeBrandId !== "ALL") {
        context = "CATEGORY_BRAND";
      } else if (activeCategoryId !== "ALL" && activeBrandId === "ALL") {
        context = "CATEGORY";
      } else if (activeBrandId !== "ALL" && activeCategoryId === "ALL") {
        context = "BRAND";
      }

      const payload = items.map((item, index) => ({
        productId: item.productId,
        orderValue: index,
        orderContext: context
      }));
      return adminService.reorderProducts(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product display priorities updated!");
      setHasChanges(false);
    },
    onError: () => toast.error("Failed to update product priorities")
  });

  if (isProductsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Product Priority</h2>
          <p className="text-muted-foreground">Drag and drop products to reorder them on the website.</p>
        </div>
        <Button 
          onClick={() => reorderMutation.mutate()} 
          disabled={!hasChanges || reorderMutation.isPending || isInvalidMode}
          variant="brand"
        >
          {reorderMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
          Save Order
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/50 p-4 rounded-xl">
        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Category</label>
          <Select 
            value={activeCategoryId} 
            onValueChange={setActiveCategoryId}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Brand</label>
          <Select 
            value={activeBrandId} 
            onValueChange={setActiveBrandId}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Brands</SelectItem>
              {brands?.map((brand) => (
                <SelectItem key={brand.brandId} value={brand.brandId}>
                  {brand.brandName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
          No products found for the selected filters.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map(i => i.productId)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
              {items.map((product) => (
                <SortableProductCard key={product.productId} product={product} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
