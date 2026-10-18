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
      <DialogContent className="fixed z-50 inset-0 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 flex flex-col bg-background sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-auto sm:max-h-[88vh] sm:w-full sm:max-w-[650px] lg:max-w-[900px] sm:rounded-2xl sm:border shadow-2xl">
        <DialogHeader className="px-4 py-3.5 sm:px-6 sm:py-4 border-b shrink-0 flex flex-row items-center justify-between bg-background pr-12">
          <DialogTitle className="text-base sm:text-lg font-bold">{isEditing ? "Edit Address" : "Add New Address"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 overscroll-contain">
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
