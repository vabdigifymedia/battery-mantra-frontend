"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/feedback/Spinner";
import { AlertTriangle, Trash2, ArrowRight, ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { UserResponse } from "@/types/dto";

interface AdminDeleteUserModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminDeleteUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: AdminDeleteUserModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmText("");
      setHasAcknowledged(false);
    }
  }, [isOpen]);

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!user?.userId) throw new Error("No user selected for deletion");
      return adminService.deleteUser(user.userId);
    },
    onSuccess: () => {
      toast.success("User and all associated data permanently deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete user");
    },
  });

  if (!user) return null;

  const displayName = user.name || user.username || "Unknown User";
  const displayContact = user.phoneNumber || (user as any).phone || user.email || "No contact info";
  const isConfirmValid = confirmText.trim().toUpperCase() === "DELETE" && hasAcknowledged;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !deleteMutation.isPending && onClose()}>
      <DialogContent className="max-w-md p-6 overflow-hidden">
        {step === 1 ? (
          <div>
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Step 1 of 2: Danger Zone
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Permanently Delete User?
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  This action is irreversible and will delete the customer and all related records.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="my-5 space-y-3">
              {/* User Snapshot Card */}
              <div className="rounded-lg border bg-muted/40 p-3.5 text-sm space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Target Account:</span>
                  <span className="font-semibold text-foreground">{displayName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="font-mono text-foreground">{displayContact}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-semibold text-foreground">{user.role}</span>
                </div>
              </div>

              {/* Consequence List */}
              <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-950 dark:bg-red-950/30 p-3.5 text-xs text-red-900 dark:text-red-200 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-red-700 dark:text-red-400">
                  <ShieldAlert className="h-4 w-4" />
                  The following data will be permanently purged:
                </div>
                <ul className="list-disc pl-5 space-y-1 opacity-90">
                  <li>User login credentials and account access</li>
                  <li>All past, active, or cancelled orders and order items</li>
                  <li>Saved delivery addresses and vehicle information</li>
                  <li>Active shopping cart items and wishlists</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setStep(2)}
              >
                <span>Continue to Verification</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div>
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <Trash2 className="h-7 w-7" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Step 2 of 2: Final Confirmation
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Confirm Permanent Deletion
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Please confirm that you want to delete <span className="font-semibold text-foreground">{displayName}</span>.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="my-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-confirm" className="text-xs font-medium">
                  Type <span className="font-mono font-bold text-red-600 select-all">DELETE</span> to confirm:
                </Label>
                <Input
                  id="delete-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  autoFocus
                  className="font-mono tracking-wider focus-visible:ring-red-500"
                  disabled={deleteMutation.isPending}
                />
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <Checkbox
                  id="acknowledge-delete"
                  checked={hasAcknowledged}
                  onCheckedChange={(checked) => setHasAcknowledged(!!checked)}
                  disabled={deleteMutation.isPending}
                />
                <Label
                  htmlFor="acknowledge-delete"
                  className="text-xs text-muted-foreground leading-tight cursor-pointer"
                >
                  I understand that this action is irreversible and all order history and customer data will be erased immediately.
                </Label>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => setStep(1)}
                disabled={deleteMutation.isPending}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                disabled={!isConfirmValid || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    <span>Deleting User...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete User Permanently</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
