import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
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
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { UserPlus, ShieldAlert } from "lucide-react";

const createSubAdminSchema = z.object({
  username: z.string().trim().min(2, "Username is required (min 2 characters)"),
  email: z.string().trim().email("Enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.length >= 10, "Phone number must be at least 10 digits if entered"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  gatePin: z
    .string()
    .optional()
    .refine(
      (v) => !v || (v.length >= 4 && v.length <= 32),
      "Gate PIN must be between 4 and 32 characters if provided"
    ),
});

type CreateSubAdminValues = z.infer<typeof createSubAdminSchema>;

interface CreateSubAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSubAdminModal({ open, onOpenChange }: CreateSubAdminModalProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateSubAdminValues>({
    resolver: zodResolver(createSubAdminSchema),
    defaultValues: {
      username: "",
      email: "",
      phoneNumber: "",
      password: "",
      gatePin: "",
    },
  });

  useEffect(() => {
    if (!open) {
      setServerError(null);
      form.reset({
        username: "",
        email: "",
        phoneNumber: "",
        password: "",
        gatePin: "",
      });
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: (values: CreateSubAdminValues) =>
      adminService.createSubAdmin({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        phoneNumber: values.phoneNumber?.trim() || undefined,
        gatePin: values.gatePin?.trim() || undefined,
      }),
    onSuccess: (created) => {
      setServerError(null);
      form.reset({
        username: "",
        email: "",
        phoneNumber: "",
        password: "",
        gatePin: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "gate-config"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`Sub-Admin "${created?.username || "account"}" created successfully`);
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to create Sub-Admin account.";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    createMutation.mutate(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Create Sub-Admin
          </DialogTitle>
          <DialogDescription>
            Add a new Sub-Admin account. Website sign-in uses username/email + password; optionally set their
            personal Mobile App Gate PIN now.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-1" autoComplete="off">
          <FormField
            label="Username"
            htmlFor="subadmin-username"
            required
            error={form.formState.errors.username?.message}
          >
            <Input
              id="subadmin-username"
              placeholder="e.g. rahul_subadmin"
              autoComplete="off"
              {...form.register("username")}
            />
          </FormField>

          <FormField
            label="Email Address"
            htmlFor="subadmin-email"
            required
            error={form.formState.errors.email?.message}
          >
            <Input
              id="subadmin-email"
              type="email"
              placeholder="subadmin@batterymantra.com"
              autoComplete="off"
              {...form.register("email")}
            />
          </FormField>

          <FormField
            label="Phone Number (Optional)"
            htmlFor="subadmin-phone"
            error={form.formState.errors.phoneNumber?.message}
          >
            <Input
              id="subadmin-phone"
              type="tel"
              placeholder="9876543210"
              autoComplete="off"
              {...form.register("phoneNumber")}
            />
          </FormField>

          <FormField
            label="Website Login Password"
            htmlFor="subadmin-password"
            required
            error={form.formState.errors.password?.message}
          >
            <PasswordInput
              id="subadmin-password"
              placeholder="Min 6 characters"
              autoComplete="new-password"
              {...form.register("password")}
            />
          </FormField>

          <div className="pt-2 border-t space-y-2">
            <FormField
              label="Gate PIN (optional, min 4 chars)"
              htmlFor="subadmin-gatepin"
              error={form.formState.errors.gatePin?.message}
            >
              <PasswordInput
                id="subadmin-gatepin"
                maxLength={32}
                placeholder="Optional unique PIN for Mobile App"
                autoComplete="new-password"
                {...form.register("gatePin")}
              />
            </FormField>
            <p className="text-[11px] text-muted-foreground">
              If set, this personal PIN must be unique across all Admin &amp; Sub-Admin accounts. You can also set
              or change it later in Mobile Gate PINs.
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-start gap-2"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2 text-white" /> Creating...
                </>
              ) : (
                "Create Sub-Admin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

