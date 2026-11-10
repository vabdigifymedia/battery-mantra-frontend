import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminRoute } from "@/guards/AdminRoute";
import { ROLES } from "@/constants/roles";
import {
  adminService,
  type AdminGateConfigResponse,
  type GateConfigUserItem,
  type GatePinRole,
} from "@/services/admin.service";
import { CreateSubAdminModal } from "@/components/admin/CreateSubAdminModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  RefreshCw,
  Search,
  Users,
  UserPlus,
} from "lucide-react";

export const Route = createFileRoute("/kalkaji/security")({
  component: AdminSecurityPage,
});

const pinFormSchema = z
  .object({
    newPin: z
      .string()
      .min(4, "Gate PIN must be at least 4 characters")
      .max(32, "Gate PIN must not exceed 32 characters"),
    confirmPin: z.string().min(1, "Please confirm the new PIN"),
    currentPassword: z.string().min(1, "Your current Super Admin password is required"),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "Confirm New PIN does not match New PIN",
    path: ["confirmPin"],
  });

type PinFormValues = z.infer<typeof pinFormSchema>;

function formatTimestamp(timestamp?: string | null, fallbackLabel = "Using system default"): string {
  if (!timestamp) return fallbackLabel;
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return String(timestamp);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function TierFallbackCard({
  role,
  configured,
  updatedAt,
  isLoading,
}: {
  role: GatePinRole;
  configured: boolean;
  updatedAt?: string | null;
  isLoading: boolean;
}) {
  const isAdmin = role === "ADMIN";
  return (
    <Card className={`border-l-4 ${configured ? "border-l-emerald-500" : "border-l-amber-500"}`}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {isAdmin ? "Super Admin Fallback PIN" : "Sub-Admin Fallback PIN"}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              {role}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {isAdmin
              ? "Tier-level fallback PIN for ADMIN accounts without a personal PIN."
              : "Tier-level fallback PIN for SUB_ADMIN accounts without a personal PIN."}
          </CardDescription>
        </div>

        {isLoading ? (
          <Spinner size="sm" />
        ) : configured ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/15 gap-1 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" /> Configured
          </Badge>
        ) : (
          <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/15 gap-1 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" /> Default
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Tier Config Updated:</span>
          <span className="font-medium text-foreground">
            {isLoading ? "Checking..." : formatTimestamp(updatedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function GatePinFields({
  form,
  idPrefix,
  newPinLabel,
  serverError,
}: {
  form: ReturnType<typeof useForm<PinFormValues>>;
  idPrefix: string;
  newPinLabel: string;
  serverError: string | null;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label={newPinLabel}
          htmlFor={`${idPrefix}-newPin`}
          required
          error={form.formState.errors.newPin?.message}
        >
          <PasswordInput
            id={`${idPrefix}-newPin`}
            maxLength={32}
            autoComplete="new-password"
            placeholder="Min 4 chars (unique)"
            {...form.register("newPin")}
          />
        </FormField>

        <FormField
          label="Confirm New PIN"
          htmlFor={`${idPrefix}-confirmPin`}
          required
          error={form.formState.errors.confirmPin?.message}
        >
          <PasswordInput
            id={`${idPrefix}-confirmPin`}
            maxLength={32}
            autoComplete="new-password"
            placeholder="Re-enter PIN"
            {...form.register("confirmPin")}
          />
        </FormField>
      </div>

      <FormField
        label="Current Super Admin Password"
        htmlFor={`${idPrefix}-currentPassword`}
        required
        error={form.formState.errors.currentPassword?.message}
      >
        <PasswordInput
          id={`${idPrefix}-currentPassword`}
          autoComplete="current-password"
          placeholder="Enter your Super Admin login password"
          {...form.register("currentPassword")}
        />
      </FormField>

      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-start gap-2"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}
    </>
  );
}

function SetUserGatePinDialog({
  user,
  onClose,
}: {
  user: GateConfigUserItem | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      newPin: "",
      confirmPin: "",
      currentPassword: "",
    },
  });

  useEffect(() => {
    setServerError(null);
    form.reset({ newPin: "", confirmPin: "", currentPassword: "" });
  }, [user, form]);

  const updateUserPinMutation = useMutation({
    mutationFn: (values: PinFormValues) => {
      if (!user) throw new Error("No user selected");
      return adminService.updateUserGatePin(user.userId, {
        newPin: values.newPin,
        currentPassword: values.currentPassword,
      });
    },
    onSuccess: (updatedConfig) => {
      setServerError(null);
      form.reset({ newPin: "", confirmPin: "", currentPassword: "" });
      queryClient.setQueryData(["admin", "security", "gate-config"], updatedConfig);
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "gate-config"] });
      toast.success(`Personal Mobile Gate PIN saved for ${user?.username || "account"}`);
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err?.message ||
        "Failed to set personal Gate PIN. Check your current password and ensure the PIN is unique across all Admin & Sub-Admin accounts.";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    updateUserPinMutation.mutate(values);
  });

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {user?.personalPinConfigured ? "Change Personal Gate PIN" : "Set Personal Gate PIN"}
          </DialogTitle>
          <DialogDescription>
            Assign a unique personal Mobile App Gate PIN for{" "}
            <strong className="text-foreground">{user?.username}</strong>.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <form onSubmit={onSubmit} className="space-y-4 py-1" autoComplete="off">
            <div className="rounded-lg bg-muted/40 border p-3 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{user.username}</p>
                <p className="text-muted-foreground truncate">{user.email}</p>
              </div>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="shrink-0">
                {user.role}
              </Badge>
            </div>

            <GatePinFields
              form={form}
              idPrefix="user"
              newPinLabel="New Personal PIN (4–32 chars)"
              serverError={serverError}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserPinMutation.isPending}>
                {updateUserPinMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2 text-white" /> Saving...
                  </>
                ) : (
                  "Save Personal PIN"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TierFallbackPinForm({ targetRole }: { targetRole: GatePinRole }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const label = targetRole === "ADMIN" ? "Super Admin Fallback PIN" : "Sub-Admin Fallback PIN";

  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      newPin: "",
      confirmPin: "",
      currentPassword: "",
    },
  });

  useEffect(() => {
    setServerError(null);
    form.reset({ newPin: "", confirmPin: "", currentPassword: "" });
  }, [targetRole, form]);

  const updateTierMutation = useMutation({
    mutationFn: (values: PinFormValues) =>
      adminService.updateGatePin({
        targetRole,
        newPin: values.newPin,
        currentPassword: values.currentPassword,
      }),
    onSuccess: (updatedConfig) => {
      setServerError(null);
      form.reset({ newPin: "", confirmPin: "", currentPassword: "" });
      queryClient.setQueryData(["admin", "security", "gate-config"], updatedConfig);
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "gate-config"] });
      toast.success(`${label} updated securely`);
    },
    onError: (err: any) => {
      const msg =
        err?.message ||
        "Failed to update fallback tier PIN. Verify your current password and ensure it is distinct from other PINs.";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    updateTierMutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
      <GatePinFields
        form={form}
        idPrefix={`tier-${targetRole}`}
        newPinLabel="New Tier Gate PIN (4–32 chars)"
        serverError={serverError}
      />

      <div className="flex justify-end pt-2 border-t">
        <Button type="submit" disabled={updateTierMutation.isPending} className="gap-2">
          {updateTierMutation.isPending ? (
            <>
              <Spinner size="sm" className="text-white" /> Saving...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" /> Save {targetRole} Fallback PIN
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function AdminSecurityContent() {
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "SUB_ADMIN">("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserForPin, setSelectedUserForPin] = useState<GateConfigUserItem | null>(null);
  const [createSubAdminOpen, setCreateSubAdminOpen] = useState(false);
  const [tierTab, setTierTab] = useState<GatePinRole>("ADMIN");

  const {
    data: gateConfig,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<AdminGateConfigResponse>({
    queryKey: ["admin", "security", "gate-config"],
    queryFn: () => adminService.getGateConfig(),
    staleTime: 30_000,
  });

  const usersList = useMemo(() => gateConfig?.users || [], [gateConfig?.users]);

  const adminCount = useMemo(
    () => usersList.filter((u) => u.role === "ADMIN").length,
    [usersList]
  );
  const subAdminCount = useMemo(
    () => usersList.filter((u) => u.role === "SUB_ADMIN").length,
    [usersList]
  );

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        return (
          (u.username || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [usersList, roleFilter, userSearch]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Mobile App Gate PIN Management
              </h1>
              <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 text-xs font-semibold">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Assign unique personal Mobile App Gate PINs to Admin &amp; Sub-Admin accounts or manage tier fallbacks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateSubAdminOpen(true)} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Create Sub-Admin
          </Button>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {(error as any)?.message || "Unable to load Gate PIN configuration from server."}
          </span>
        </div>
      )}

      {/* Tier Fallback Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TierFallbackCard
          role="ADMIN"
          configured={Boolean(gateConfig?.adminPinConfigured)}
          updatedAt={gateConfig?.updatedAt}
          isLoading={isLoading}
        />
        <TierFallbackCard
          role="SUB_ADMIN"
          configured={Boolean(gateConfig?.subAdminPinConfigured)}
          updatedAt={gateConfig?.updatedAt}
          isLoading={isLoading}
        />
      </div>

      {/* Primary Table: Individual Personal Gate PINs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Individual Personal Gate PINs
              </CardTitle>
              <CardDescription>
                Each Admin and Sub-Admin can have a unique personal Mobile Gate PIN (plaintext/hashed PINs are never returned).
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "ALL", label: `All (${usersList.length})` },
                { id: "ADMIN", label: `Admins (${adminCount})` },
                { id: "SUB_ADMIN", label: `Sub-Admins (${subAdminCount})` },
              ].map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  variant={roleFilter === t.id ? "default" : "outline"}
                  onClick={() => setRoleFilter(t.id as any)}
                  className="h-8 text-xs"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6">Account</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Personal Gate PIN</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Spinner size="md" className="inline-block mr-2" />
                      <span className="text-sm text-muted-foreground">Loading accounts...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                      No Admin or Sub-Admin accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.userId} className="hover:bg-muted/30">
                      <TableCell className="pl-6">
                        <div className="font-semibold text-sm">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={u.role === "ADMIN" ? "default" : "secondary"}
                          className="font-mono text-[11px]"
                        >
                          {u.role}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            u.isActive
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 text-[11px]"
                              : "border-red-300 bg-red-50 text-red-700 text-[11px]"
                          }
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {u.personalPinConfigured ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/15 gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" /> Configured
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50/70 text-amber-800 dark:text-amber-300 gap-1 text-xs"
                          >
                            <AlertTriangle className="h-3 w-3" /> Not Set (Uses Fallback)
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(u.gatePinUpdatedAt, "Never set")}
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <Button
                          size="sm"
                          variant={u.personalPinConfigured ? "outline" : "default"}
                          onClick={() => setSelectedUserForPin(u)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          {u.personalPinConfigured ? "Change PIN" : "Set PIN"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Section: Optional Tier-Level Fallback PIN Configuration */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Tier-Level Fallback PIN Configuration (Optional)
          </CardTitle>
          <CardDescription>
            Configure the shared fallback Mobile Gate PIN used when an account does not yet have a personal PIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tierTab} onValueChange={(v) => setTierTab(v as GatePinRole)}>
            <TabsList className="grid w-full grid-cols-2 mb-5">
              <TabsTrigger value="ADMIN" className="text-xs sm:text-sm font-semibold">
                ADMIN Fallback PIN
              </TabsTrigger>
              <TabsTrigger value="SUB_ADMIN" className="text-xs sm:text-sm font-semibold">
                SUB_ADMIN Fallback PIN
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ADMIN">
              <TierFallbackPinForm targetRole="ADMIN" />
            </TabsContent>
            <TabsContent value="SUB_ADMIN">
              <TierFallbackPinForm targetRole="SUB_ADMIN" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Set / Change Individual User Gate PIN Modal */}
      <SetUserGatePinDialog
        user={selectedUserForPin}
        onClose={() => setSelectedUserForPin(null)}
      />

      {/* Create Sub-Admin Modal (with Optional Gate PIN) */}
      <CreateSubAdminModal
        open={createSubAdminOpen}
        onOpenChange={setCreateSubAdminOpen}
      />
    </div>
  );
}

function AdminSecurityPage() {
  return (
    <AdminRoute roles={[ROLES.ADMIN]} redirectTo="/kalkaji">
      <AdminSecurityContent />
    </AdminRoute>
  );
}
