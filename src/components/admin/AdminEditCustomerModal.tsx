"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, AdminUpdateCustomerRequest } from "@/services/admin.service";
import { queryKeys } from "@/constants/queryKeys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/feedback/Spinner";
import { UserCheck, MapPin, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import type { UserResponse } from "@/types/dto";

interface AdminEditCustomerModalProps {
  customer: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedUser: UserResponse) => void;
}

export function AdminEditCustomerModal({
  customer,
  isOpen,
  onClose,
  onSuccess,
}: AdminEditCustomerModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (customer) {
      const c = customer as any;
      const addr = c.addresses?.[0] || {};
      setFormData({
        name: customer.name || customer.username || "",
        phone: c.phone || customer.phoneNumber || "",
        email: customer.email || "",
        addressLine1: c.addressLine1 || addr.addressLine1 || addr.line1 || "",
        addressLine2: c.addressLine2 || addr.addressLine2 || addr.line2 || "",
        city: c.city || addr.city || "",
        state: c.state || addr.state || "",
        pincode: c.pincode || addr.pincode || "",
      });
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (data: AdminUpdateCustomerRequest) => {
      if (!customer?.userId) throw new Error("No customer selected");
      return adminService.updateCustomer(customer.userId, data);
    },
    onSuccess: (updatedUser) => {
      toast.success("Customer updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      onSuccess?.(updatedUser);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update customer");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    updateMutation.mutate({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      addressLine1: formData.addressLine1.trim() || undefined,
      addressLine2: formData.addressLine2.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      pincode: formData.pincode.trim() || undefined,
    });
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !updateMutation.isPending && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Edit Customer Profile</DialogTitle>
              <DialogDescription className="text-xs">
                Update customer contact details and primary delivery address.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Identity & Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Personal & Contact Info
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name" className="text-xs font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cust-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  required
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone" className="text-xs font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" /> Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cust-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  required
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-email" className="text-xs font-medium flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" /> Email Address (Optional)
              </Label>
              <Input
                id="cust-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rahul@gmail.com"
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          {/* Primary Address Details */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Address Details
            </h4>

            <div className="space-y-1.5">
              <Label htmlFor="cust-addr1" className="text-xs font-medium">
                Address Line 1
              </Label>
              <Input
                id="cust-addr1"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="House / Flat / Plot No., Building Name"
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-addr2" className="text-xs font-medium">
                Address Line 2 (Optional)
              </Label>
              <Input
                id="cust-addr2"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="Street, Landmark, Sector"
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-city" className="text-xs font-medium">
                  City
                </Label>
                <Input
                  id="cust-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Noida"
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-state" className="text-xs font-medium">
                  State
                </Label>
                <Input
                  id="cust-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Uttar Pradesh"
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-pincode" className="text-xs font-medium">
                  Pincode
                </Label>
                <Input
                  id="cust-pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="e.g. 201301"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 shadow-sm font-semibold"
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
