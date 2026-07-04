import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SkeletonBlock } from "@/components/feedback/SkeletonPresets";
import { AddressForm, type AddressFormValues } from "./AddressForm";
import { addressesQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { addressesService } from "@/services/addresses.service";
import type { AddressResponse } from "@/types/dto";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";

interface AddressSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function AddressSelector({ value, onChange }: AddressSelectorProps) {
  const qc = useQueryClient();
  const { data: addresses, isLoading } = useQuery(addressesQuery(true));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null);

  const addMut = useMutation({
    mutationFn: (data: AddressFormValues) => addressesService.add(data),
    onSuccess: (newAddr) => {
      qc.invalidateQueries({ queryKey: queryKeys.addresses.all });
      toast.success("Address added");
      onChange(newAddr.addressId);
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to add address"),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressFormValues }) => addressesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.addresses.all });
      toast.success("Address updated");
      closeModal();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update address"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => addressesService.delete(id),
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: queryKeys.addresses.all });
      toast.success("Address deleted");
      if (value === deletedId) onChange("");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete address"),
  });

  const handleSave = async (data: AddressFormValues) => {
    if (editingAddress) {
      await editMut.mutateAsync({ id: editingAddress.addressId, data });
    } else {
      await addMut.mutateAsync(data);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: AddressResponse) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return (
      <div className="grid gap-3">
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
      </div>
    );
  }

  const list = addresses ?? [];

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-semibold">No saved addresses</h3>
          <p className="mb-4 text-xs text-muted-foreground">Add an address to proceed with checkout.</p>
          <Button variant="brand" onClick={openAddModal} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Address
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((addr) => {
            const isSelected = value === addr.addressId;
            return (
              <div
                key={addr.addressId}
                className={`relative flex flex-col gap-2 rounded-xl border p-4 transition-colors ${
                  isSelected ? "border-primary bg-primary-soft/50 ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <button
                  type="button"
                  className="absolute inset-0 z-0 h-full w-full cursor-pointer rounded-xl focus:outline-none"
                  onClick={() => onChange(addr.addressId)}
                  aria-label={`Select address ${addr.addressId}`}
                />
                
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <p>{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      <p>
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p>{addr.country}</p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Phone: <span className="font-normal text-muted-foreground">{addr.phoneNumber}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(addr);
                      }}
                      aria-label="Edit address"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this address?")) {
                          delMut.mutate(addr.addressId);
                        }
                      }}
                      disabled={delMut.isPending}
                      aria-label="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          <Button variant="outline" className="mt-2 w-full border-dashed" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add New Address
          </Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          {isModalOpen && (
            <AddressForm
              initialData={editingAddress ?? undefined}
              onSubmit={handleSave}
              onCancel={closeModal}
              isSubmitting={addMut.isPending || editMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
