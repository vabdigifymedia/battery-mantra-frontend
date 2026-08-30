import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/forms/FormField";
import { Spinner } from "@/components/feedback/Spinner";
import { LocationPicker } from "./LocationPicker";
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
  isDefault: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialData?: AddressResponse;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

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
      isDefault: (initialData as any)?.default ?? initialData?.isDefault ?? false,
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
    },
  });

  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const deliveryCoords = latitude && longitude ? { lat: latitude, lng: longitude } : null;

  const handleLocationChange = (coords: { lat: number; lng: number } | null) => {
    if (coords) {
      form.setValue("latitude", coords.lat, { shouldDirty: true });
      form.setValue("longitude", coords.lng, { shouldDirty: true });
    } else {
      form.setValue("latitude", undefined, { shouldDirty: true });
      form.setValue("longitude", undefined, { shouldDirty: true });
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Side: Form Fields */}
        <div className="space-y-4">
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
              <Controller
                control={form.control}
                name="state"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Postal Code" htmlFor="postalCode" required error={form.formState.errors.postalCode?.message}>
              <Input id="postalCode" {...form.register("postalCode")} />
            </FormField>
            <FormField label="Country" htmlFor="country" required error={form.formState.errors.country?.message}>
              <Controller
                control={form.control}
                name="country"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Controller
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <Checkbox 
                  id="isDefault" 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                  className="text-primary focus:ring-primary"
                />
              )}
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-foreground cursor-pointer">Make this my default address</label>
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="flex flex-col h-full min-h-[300px]">
          <label className="text-sm font-medium text-foreground mb-2 block">Pin Exact Location (Optional but recommended)</label>
          <div className="flex-1 w-full h-full">
            <LocationPicker value={deliveryCoords} onChange={handleLocationChange} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
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
