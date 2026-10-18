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

export const Route = createFileRoute("/admin/engineers/new")({
  component: NewEngineerPage,
});

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

function NewEngineerPage() {
  const navigate = useNavigate();

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
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await engineerService.create(values as any);
      toast.success("Engineer created successfully");
      navigate({ to: "/admin/engineers" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create engineer");
    }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/engineers" })}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Engineer</h1>
          <p className="text-muted-foreground">Create a new delivery engineer profile.</p>
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
            <FormField label="Password" error={form.formState.errors.password?.message}>
              <PasswordInput {...form.register("password")} placeholder="Create a password" />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/engineers" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Engineer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
