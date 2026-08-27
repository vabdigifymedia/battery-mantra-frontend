import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { Spinner } from "@/components/feedback/Spinner";
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
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers, CornerDownRight } from "lucide-react";

function SortableCategoryItem({ category, depth }: { category: any, depth: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.categoryId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    marginLeft: `${depth * 24}px`
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 mb-2 rounded-lg border bg-card shadow-sm ${
        isDragging ? "ring-2 ring-primary opacity-90 scale-[1.02]" : "hover:border-primary/50"
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      {depth > 0 && <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      {category.iconUrl ? (
        <img src={category.iconUrl} alt={category.categoryName} className="h-6 w-6 object-contain rounded mix-blend-multiply" />
      ) : (
        <Layers className="h-5 w-5 text-muted-foreground" />
      )}
      <span className="font-medium text-sm flex-1">{category.categoryName}</span>
    </div>
  );
}

export function CategoryReorderModal({ isOpen, onClose, categories }: { isOpen: boolean, onClose: () => void, categories: any[] }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen && categories) {
      const list: any[] = [];
      function traverse(cats: any[], level: number) {
        const sorted = [...cats].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        for (const cat of sorted) {
          list.push({ ...cat, depth: level });
          if (cat.subCategories && cat.subCategories.length > 0) {
            traverse(cat.subCategories, level + 1);
          }
        }
      }
      traverse(categories, 0);
      setItems(list);
      setHasChanges(false);
    }
  }, [isOpen, categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.categoryId === active.id);
        const newIndex = items.findIndex((item) => item.categoryId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const reorderMutation = useMutation({
    mutationFn: async () => {
      const payload = items.map((item, index) => ({
        categoryId: item.categoryId,
        displayOrder: index
      }));
      return adminService.reorderCategories(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categories reordered successfully!");
      setHasChanges(false);
      onClose();
    },
    onError: () => toast.error("Failed to reorder categories")
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reorder Categories</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-1 py-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.categoryId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {items.map((item) => (
                  <SortableCategoryItem key={item.categoryId} category={item} depth={item.depth} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => reorderMutation.mutate()} 
            disabled={!hasChanges || reorderMutation.isPending}
            variant="brand"
          >
            {reorderMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
            Save Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
