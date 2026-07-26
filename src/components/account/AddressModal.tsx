import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addressesService } from "@/services/addresses.service";
import type { AddressRequest, AddressResponse } from "@/types/dto";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
  addressLine1: z.string().min(5, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(5, "Postal code is required"),
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
});

type FormValues = z.infer<typeof addressSchema>;

interface AddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressToEdit?: AddressResponse | null;
}

export function AddressModal({ open, onOpenChange, addressToEdit }: AddressModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!addressToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(addressSchema) as any,
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (open && addressToEdit) {
      form.reset({
        fullName: addressToEdit.fullName,
        phoneNumber: addressToEdit.phoneNumber,
        addressLine1: addressToEdit.addressLine1,
        addressLine2: addressToEdit.addressLine2 || "",
        city: addressToEdit.city,
        state: addressToEdit.state,
        postalCode: addressToEdit.postalCode,
        country: addressToEdit.country || "India",
        isDefault: addressToEdit.isDefault,
      });
    } else if (open && !addressToEdit) {
      form.reset({
        fullName: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        isDefault: false,
      });
    }
  }, [open, addressToEdit, form]);

  const addMutation = useMutation({
    mutationFn: addressesService.add,
    onSuccess: () => {
      toast.success("Address added successfully");
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to add address"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressRequest }) => addressesService.update(id, data),
    onSuccess: () => {
      toast.success("Address updated successfully");
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update address"),
  });

  const onSubmit = form.handleSubmit((data) => {
    const reqData: AddressRequest = {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country || "India",
      isDefault: !!data.isDefault,
    };
    if (isEditing && addressToEdit) {
      updateMutation.mutate({ id: addressToEdit.addressId, data: reqData });
    } else {
      addMutation.mutate(reqData);
    }
  });

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{isEditing ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your shipping address details below." : "Enter a new shipping address."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name" htmlFor="fullName" error={form.formState.errors.fullName?.message}>
                <Input id="fullName" {...form.register("fullName")} />
              </FormField>
              <FormField label="Phone Number" htmlFor="phoneNumber" error={form.formState.errors.phoneNumber?.message}>
                <Input id="phoneNumber" type="tel" {...form.register("phoneNumber")} />
              </FormField>
            </div>

            <FormField label="Address Line 1" htmlFor="addressLine1" error={form.formState.errors.addressLine1?.message}>
              <Input id="addressLine1" placeholder="Street address, P.O. box, company name, c/o" {...form.register("addressLine1")} />
            </FormField>

            <FormField label="Address Line 2 (Optional)" htmlFor="addressLine2" error={form.formState.errors.addressLine2?.message}>
              <Input id="addressLine2" placeholder="Apartment, suite, unit, building, floor, etc." {...form.register("addressLine2")} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="City" htmlFor="city" error={form.formState.errors.city?.message}>
                <Input id="city" {...form.register("city")} />
              </FormField>
              <FormField label="State" htmlFor="state" error={form.formState.errors.state?.message}>
                <Input id="state" {...form.register("state")} />
              </FormField>
            </div>

            <FormField label="Postal Code" htmlFor="postalCode" error={form.formState.errors.postalCode?.message}>
              <Input id="postalCode" {...form.register("postalCode")} />
            </FormField>

            <label className="flex items-center gap-2 text-sm font-medium pt-2 cursor-pointer">
              <input type="checkbox" className="rounded border-border text-primary focus:ring-primary h-4 w-4" {...form.register("isDefault")} />
              Set as default address
            </label>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="w-4 h-4 mr-2" />}
              {isEditing ? "Update Address" : "Save Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
