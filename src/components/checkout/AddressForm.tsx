import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { Spinner } from "@/components/feedback/Spinner";
import type { AddressRequest, AddressResponse } from "@/types/dto";

const addressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phoneNumber: z.string().trim().min(10, "Valid phone number is required"),
  addressLine1: z.string().trim().min(1, "Address is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
  isDefault: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialData?: AddressResponse;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AddressForm({ initialData, onSubmit, onCancel, isSubmitting }: AddressFormProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: initialData?.fullName ?? "",
      phoneNumber: initialData?.phoneNumber ?? "",
      addressLine1: initialData?.addressLine1 ?? "",
      addressLine2: initialData?.addressLine2 ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "",
      postalCode: initialData?.postalCode ?? "",
      country: initialData?.country ?? "India",
      isDefault: initialData?.isDefault ?? false,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full Name" htmlFor="fullName" required error={form.formState.errors.fullName?.message}>
          <Input id="fullName" {...form.register("fullName")} />
        </FormField>
        <FormField label="Phone Number" htmlFor="phoneNumber" required error={form.formState.errors.phoneNumber?.message}>
          <Input id="phoneNumber" type="tel" {...form.register("phoneNumber")} />
        </FormField>
      </div>

      <FormField label="Address Line 1" htmlFor="addressLine1" required error={form.formState.errors.addressLine1?.message}>
        <Input id="addressLine1" {...form.register("addressLine1")} />
      </FormField>

      <FormField label="Address Line 2" htmlFor="addressLine2" error={form.formState.errors.addressLine2?.message}>
        <Input id="addressLine2" {...form.register("addressLine2")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City" htmlFor="city" required error={form.formState.errors.city?.message}>
          <Input id="city" {...form.register("city")} />
        </FormField>
        <FormField label="State" htmlFor="state" required error={form.formState.errors.state?.message}>
          <Input id="state" {...form.register("state")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Postal Code" htmlFor="postalCode" required error={form.formState.errors.postalCode?.message}>
          <Input id="postalCode" {...form.register("postalCode")} />
        </FormField>
        <FormField label="Country" htmlFor="country" required error={form.formState.errors.country?.message}>
          <Input id="country" {...form.register("country")} />
        </FormField>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input type="checkbox" id="isDefault" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" {...form.register("isDefault")} />
        <label htmlFor="isDefault" className="text-sm font-medium text-foreground">Make this my default address</label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="brand" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
          {initialData ? "Update Address" : "Save Address"}
        </Button>
      </div>
    </form>
  );
}
