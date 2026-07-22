import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { engineerService } from "@/services/engineer.service";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/feedback/Spinner";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/engineers/$id/edit")({
  component: EditEngineerPage,
});

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  password: z.string().optional(), // Optional for edit
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function EditEngineerPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: engineer, isLoading } = useQuery({
    queryKey: ["admin", "engineers", id],
    queryFn: () => engineerService.getById(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      alternatePhone: "",
      address: "",
      password: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (engineer) {
      form.reset({
        firstName: engineer.firstName || engineer.fullName?.split(" ")[0] || "",
        lastName: engineer.lastName || engineer.fullName?.split(" ").slice(1).join(" ") || "",
        email: engineer.email,
        phoneNumber: engineer.phoneNumber,
        alternatePhone: engineer.alternatePhone || "",
        address: engineer.address || "",
        password: "",
        isActive: engineer.isActive,
      });
    }
  }, [engineer, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await engineerService.update(id, values as any);
      toast.success("Engineer updated successfully");
      navigate({ to: "/admin/engineers" });
    } catch (e: any) {
      toast.error(e.message || "Failed to update engineer");
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!engineer) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Engineer not found</h2>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/engineers" })}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/engineers" })}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Engineer</h1>
          <p className="text-muted-foreground">Update the delivery engineer profile.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField label="First Name" error={form.formState.errors.firstName?.message}>
            <Input {...form.register("firstName")} placeholder="e.g. John" />
          </FormField>

          <FormField label="Last Name" error={form.formState.errors.lastName?.message}>
            <Input {...form.register("lastName")} placeholder="e.g. Doe" />
          </FormField>

          <FormField label="Email Address" error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register("email")} placeholder="john@example.com" />
          </FormField>

          <FormField label="Phone Number" error={form.formState.errors.phoneNumber?.message}>
            <Input {...form.register("phoneNumber")} placeholder="1234567890" />
          </FormField>

          <FormField label="Alternate Phone (Optional)" error={form.formState.errors.alternatePhone?.message}>
            <Input {...form.register("alternatePhone")} placeholder="0987654321" />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Address (Optional)" error={form.formState.errors.address?.message}>
              <Input {...form.register("address")} placeholder="Full address" />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField label="New Password (Optional)" error={form.formState.errors.password?.message}>
              <PasswordInput {...form.register("password")} placeholder="Leave blank to keep current password" />
            </FormField>
          </div>
          
          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-4 bg-muted/20">
            <div className="space-y-0.5">
              <h3 className="text-base font-medium">Account Status</h3>
              <p className="text-sm text-muted-foreground">
                Active accounts can log in and receive orders. Suspended accounts cannot.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${form.watch("isActive") ? "text-green-600" : "text-muted-foreground"}`}>
                {form.watch("isActive") ? "Active" : "Suspended"}
              </span>
              <Switch
                checked={!!form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked, { shouldDirty: true })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/engineers" })}>
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
