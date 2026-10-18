import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Spinner } from "@/components/feedback/Spinner";
import { userService } from "@/services/user.service";
import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";
import { KeyRound, AlertCircle, ShieldCheck } from "lucide-react";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Reset form whenever modal closes or opens
  useEffect(() => {
    if (!open) {
      reset();
      setServerError(null);
    }
  }, [open, reset]);

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setServerError(null);
    try {
      await userService.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed successfully!");
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : (err as any)?.message || "Failed to update password. Please check your current password.";
      setServerError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <KeyRound className="h-5 w-5" />
            <DialogTitle>Change Password</DialogTitle>
          </div>
          <DialogDescription>
            Enter your current password and choose a secure new password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2" noValidate>
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <FormField
            label="Current Password"
            htmlFor="currentPassword"
            required
            error={errors.currentPassword?.message}
          >
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              placeholder="Enter your current password"
              {...register("currentPassword")}
            />
          </FormField>

          <FormField
            label="New Password"
            htmlFor="newPassword"
            required
            error={errors.newPassword?.message}
            hint="Minimum 6 characters"
          >
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              placeholder="Enter new password"
              {...register("newPassword")}
            />
          </FormField>

          <FormField
            label="Confirm New Password"
            htmlFor="confirmPassword"
            required
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Confirm new password"
              {...register("confirmPassword")}
            />
          </FormField>

          <DialogFooter className="pt-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Update Password</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
