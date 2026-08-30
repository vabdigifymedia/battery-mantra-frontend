import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addressesService } from "@/services/addresses.service";
import type { AddressRequest, AddressResponse } from "@/types/dto";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AddressForm, type AddressFormValues } from "@/components/checkout/AddressForm";

interface AddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressToEdit?: AddressResponse | null;
}

export function AddressModal({ open, onOpenChange, addressToEdit }: AddressModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!addressToEdit;

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

  const handleSave = async (data: AddressFormValues) => {
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
      latitude: data.latitude,
      longitude: data.longitude,
    };
    if (isEditing && addressToEdit) {
      await updateMutation.mutateAsync({ id: addressToEdit.addressId, data: reqData });
    } else {
      await addMutation.mutateAsync(reqData);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-[900px] p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{isEditing ? "Edit Address" : "Add New Address"}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 max-h-[85vh] overflow-y-auto">
          {open && (
            <AddressForm
              initialData={addressToEdit ?? undefined}
              onSubmit={handleSave}
              onCancel={() => onOpenChange(false)}
              isSubmitting={isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
