import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { couponsService } from "@/services/coupons.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { Trash2, Plus, Edit, Ticket } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { CouponResponse, CouponRequest, DiscountType } from "@/types/dto";
import { ApiError } from "@/lib/api/errors";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

const couponSchema = z.object({
  code: z.string().trim().min(3, "Code must be at least 3 characters").toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.coerce.number().min(0, "Value must be positive"),
  maxDiscountAmount: z.coerce.number().optional().nullable(),
  minOrderValue: z.coerce.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  usageLimit: z.coerce.number().optional().nullable(),
  isActive: z.boolean().default(true),
});

function AdminCoupons() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponResponse | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => couponsService.getAllAdminCoupons(),
  });

  const form = useForm<z.infer<typeof couponSchema>>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountType: "FLAT",
      discountValue: 0,
      isActive: true,
      maxDiscountAmount: null,
      minOrderValue: null,
      usageLimit: null,
      startDate: null,
      expiryDate: null,
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    form.reset();
  };

  const openEditModal = (coupon: CouponResponse) => {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount ?? null,
      minOrderValue: coupon.minOrderValue ?? null,
      usageLimit: coupon.usageLimit ?? null,
      isActive: coupon.isActive,
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : null,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : null,
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    form.reset({
      code: "",
      discountType: "FLAT",
      discountValue: 0,
      isActive: true,
      maxDiscountAmount: null,
      minOrderValue: null,
      usageLimit: null,
      startDate: null,
      expiryDate: null,
    });
    setIsModalOpen(true);
  };

  const addMutation = useMutation({
    mutationFn: (data: CouponRequest) => couponsService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon created successfully");
      closeModal();
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to create coupon");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CouponRequest }) =>
      couponsService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon updated successfully");
      closeModal();
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to update coupon");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon deleted successfully");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to delete coupon");
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    // Transform nulls to undefined or keeping as is depending on backend
    const req: CouponRequest = {
      code: values.code,
      discountType: values.discountType as DiscountType,
      discountValue: values.discountValue,
      maxDiscountAmount: values.maxDiscountAmount || undefined,
      minOrderValue: values.minOrderValue || undefined,
      usageLimit: values.usageLimit || undefined,
      isActive: values.isActive,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
      expiryDate: values.expiryDate ? new Date(values.expiryDate).toISOString() : undefined,
    };

    if (editingCoupon) {
      editMutation.mutate({ id: editingCoupon.couponId, data: req });
    } else {
      addMutation.mutate(req);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">Manage discount codes and promotions</p>
        </div>
        <Button onClick={openAddModal} variant="brand" className="shrink-0 shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Spinner size="lg" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No coupons found. Click "Add Coupon" to create one.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.couponId}>
                  <TableCell>
                    <div className="font-bold flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-emerald-600" />
                      {coupon.code}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-emerald-600">
                      {coupon.discountType === "FLAT" ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`}
                    </div>
                    {coupon.maxDiscountAmount && <div className="text-xs text-muted-foreground">Max ₹{coupon.maxDiscountAmount}</div>}
                  </TableCell>
                  <TableCell>
                    {coupon.minOrderValue && <div className="text-xs">Min Order: ₹{coupon.minOrderValue}</div>}
                    {coupon.usageLimit && <div className="text-xs">Max Uses: {coupon.usageLimit}</div>}
                    {!coupon.minOrderValue && !coupon.usageLimit && <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{coupon.usedCount}</span> times
                  </TableCell>
                  <TableCell>
                    {coupon.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditModal(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the coupon "{coupon.code}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(coupon.couponId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <FormField label="Coupon Code" htmlFor="code" required error={form.formState.errors.code?.message}>
              <Input id="code" {...form.register("code")} placeholder="e.g. FESTIVE50" className="uppercase" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Discount Type" htmlFor="discountType" required error={form.formState.errors.discountType?.message}>
                <select 
                  {...form.register("discountType")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="FLAT">Flat Amount (₹)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </FormField>
              
              <FormField label="Discount Value" htmlFor="discountValue" required error={form.formState.errors.discountValue?.message}>
                <Input id="discountValue" type="number" step="0.01" {...form.register("discountValue")} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Min Order Value (₹)" htmlFor="minOrderValue" error={form.formState.errors.minOrderValue?.message}>
                <Input id="minOrderValue" type="number" step="0.01" {...form.register("minOrderValue")} placeholder="Optional" />
              </FormField>
              
              <FormField label="Max Discount (₹)" htmlFor="maxDiscountAmount" error={form.formState.errors.maxDiscountAmount?.message}>
                <Input id="maxDiscountAmount" type="number" step="0.01" {...form.register("maxDiscountAmount")} placeholder="Optional" />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" htmlFor="startDate" error={form.formState.errors.startDate?.message}>
                <Input id="startDate" type="date" {...form.register("startDate")} />
              </FormField>
              
              <FormField label="Expiry Date" htmlFor="expiryDate" error={form.formState.errors.expiryDate?.message}>
                <Input id="expiryDate" type="date" {...form.register("expiryDate")} />
              </FormField>
            </div>

            <FormField label="Total Usage Limit" htmlFor="usageLimit" error={form.formState.errors.usageLimit?.message}>
              <Input id="usageLimit" type="number" {...form.register("usageLimit")} placeholder="Optional (e.g. 100 uses)" />
            </FormField>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" {...form.register("isActive")} />
              <label htmlFor="isActive" className="text-sm font-medium text-foreground">Active (Customers can use it)</label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addMutation.isPending || editMutation.isPending}>
                {(addMutation.isPending || editMutation.isPending) ? <Spinner size="sm" className="mr-2" /> : null}
                {editingCoupon ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
