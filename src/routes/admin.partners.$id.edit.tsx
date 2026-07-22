import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { partnerService } from "@/services/partner.service";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { locationService } from "@/services/location.service";
import { Spinner } from "@/components/feedback/Spinner";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/partners/$id/edit")({
  component: EditPartnerPage,
});

const schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  password: z.string().optional(), // Optional for edit
  operatingCityIds: z.array(z.string()).min(1, "Select at least one city"),
});

type FormValues = z.infer<typeof schema>;

function EditPartnerPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: partner, isLoading: isLoadingPartner } = useQuery({
    queryKey: ["admin", "partners", id],
    queryFn: () => partnerService.getById(id),
  });

  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: locationService.getAllCities,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      contactPerson: "",
      email: "",
      phoneNumber: "",
      alternatePhone: "",
      address: "",
      password: "",
      operatingCityIds: [],
    },
  });

  useEffect(() => {
    if (partner) {
      form.reset({
        businessName: partner.businessName,
        contactPerson: partner.contactPerson,
        email: partner.email,
        phoneNumber: partner.phoneNumber,
        alternatePhone: partner.alternatePhone || "",
        address: partner.address || "",
        password: "",
        operatingCityIds: partner.operatingCities?.map(c => c.cityId) || [],
      });
    }
  }, [partner, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await partnerService.update(id, values);
      toast.success("Partner updated successfully");
      navigate({ to: "/admin/partners" });
    } catch (e: any) {
      toast.error(e.message || "Failed to update partner");
    }
  });

  const operatingCityIds = form.watch("operatingCityIds");

  const toggleCity = (cityId: string) => {
    const current = new Set(operatingCityIds);
    if (current.has(cityId)) {
      current.delete(cityId);
    } else {
      current.add(cityId);
    }
    form.setValue("operatingCityIds", Array.from(current), { shouldValidate: true, shouldDirty: true });
  };

  if (isLoadingPartner || isLoadingCities) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Partner not found</h2>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/partners" })}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/partners" })}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Partner</h1>
          <p className="text-muted-foreground">Update partner information and assigned cities.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8 rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField label="Business Name" error={form.formState.errors.businessName?.message}>
            <Input {...form.register("businessName")} placeholder="e.g. Battery Wala" />
          </FormField>

          <FormField label="Contact Person" error={form.formState.errors.contactPerson?.message}>
            <Input {...form.register("contactPerson")} placeholder="e.g. Amit Sharma" />
          </FormField>

          <FormField label="Email Address" error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register("email")} placeholder="contact@business.com" />
          </FormField>

          <FormField label="Phone Number" error={form.formState.errors.phoneNumber?.message}>
            <Input {...form.register("phoneNumber")} placeholder="1234567890" />
          </FormField>

          <FormField label="Alternate Phone (Optional)" error={form.formState.errors.alternatePhone?.message}>
            <Input {...form.register("alternatePhone")} placeholder="0987654321" />
          </FormField>

          <FormField label="New Password (Optional)" error={form.formState.errors.password?.message}>
            <PasswordInput {...form.register("password")} placeholder="Leave blank to keep current password" />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Business Address (Optional)" error={form.formState.errors.address?.message}>
              <Input {...form.register("address")} placeholder="Full address" />
            </FormField>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Operating Cities</h3>
            <p className="text-sm text-muted-foreground">Select the cities this partner will manage.</p>
          </div>
          {form.formState.errors.operatingCityIds && (
            <p className="text-sm text-destructive">{form.formState.errors.operatingCityIds.message}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
            {cities.map((city) => {
              const isSelected = operatingCityIds.includes(city.cityId);
              return (
                <div
                  key={city.cityId}
                  onClick={() => toggleCity(city.cityId)}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">{city.cityName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/partners" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
