import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminRoute } from "@/guards/AdminRoute";
import { ROLES } from "@/constants/roles";
import {
  adminService,
  type GatePinRole,
  type GatePinRoleStatus,
} from "@/services/admin.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export const Route = createFileRoute("/kalkaji/security")({
  component: AdminSecurityPage,
});

const pinFormSchema = z
  .object({
    newPin: z
      .string()
      .regex(/^\d{4,6}$/, "Gate PIN must be 4 to 6 numeric digits"),
    confirmPin: z.string().min(1, "Please confirm the new PIN"),
    currentPassword: z.string().min(1, "Current Admin password is required to save changes"),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "Confirm New PIN does not match New PIN",
    path: ["confirmPin"],
  });

type PinFormValues = z.infer<typeof pinFormSchema>;

const ROLE_META: Record<
  GatePinRole,
  { title: string; subtitle: string; badge: string }
> = {
  ADMIN: {
    title: "Super Admin Gate PIN",
    subtitle: "Required when authenticating on mobile companion apps with ROLE_ADMIN.",
    badge: "ADMIN",
  },
  SUB_ADMIN: {
    title: "Sub-Admin Gate PIN",
    subtitle: "Required when authenticating on mobile companion apps with ROLE_SUB_ADMIN.",
    badge: "SUB_ADMIN",
  },
};

function formatUpdatedAt(timestamp?: string | null): string {
  if (!timestamp) return "Using initial system default";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return String(timestamp);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function GateStatusCard({
  status,
  isLoading,
}: {
  status?: GatePinRoleStatus;
  isLoading: boolean;
}) {
  const role: GatePinRole = status?.targetRole ?? "ADMIN";
  const meta = ROLE_META[role];
  const configured = Boolean(status?.configured);

  return (
    <Card className={`border-l-4 ${configured ? "border-l-emerald-500" : "border-l-amber-500"}`}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{meta.title}</CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              {meta.badge}
            </Badge>
          </div>
          <CardDescription className="text-xs">{meta.subtitle}</CardDescription>
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
          <span>Last Updated:</span>
          <span className="font-medium text-foreground">
            {isLoading ? "Checking..." : formatUpdatedAt(status?.updatedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function GatePinUpdateForm({ targetRole }: { targetRole: GatePinRole }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const meta = ROLE_META[targetRole];

  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      newPin: "",
      confirmPin: "",
      currentPassword: "",
    },
  });

  // Clear any transient errors/values when switching role tabs
  useEffect(() => {
    setServerError(null);
    form.reset({ newPin: "", confirmPin: "", currentPassword: "" });
  }, [targetRole, form]);

  const updateMutation = useMutation({
    mutationFn: (values: PinFormValues) =>
      adminService.updateGatePin({
        targetRole,
        newPin: values.newPin,
        currentPassword: values.currentPassword,
      }),
    onSuccess: (res) => {
      setServerError(null);
      // Never retain PIN values in memory after saving
      form.reset({ newPin: "", confirmPin: "", currentPassword: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "gate-config"] });
      toast.success(res?.message || `${meta.title} updated securely`);
    },
    onError: (err: any) => {
      const msg =
        err?.message ||
        "Failed to update Gate PIN. Check your current password and ensure the new PIN is distinct from the other role.";
      setServerError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    updateMutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
      <div className="rounded-lg border bg-muted/40 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Updating {meta.title} ({meta.badge})
          </p>
          <p>
            Enter a 4 to 6 digit numeric PIN. For security, the Super Admin and Sub-Admin PINs must be distinct,
            and saved PIN values are never stored or displayed in plaintext.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="New Mobile Gate PIN (4–6 digits)"
          htmlFor={`newPin-${targetRole}`}
          required
          error={form.formState.errors.newPin?.message}
        >
          <PasswordInput
            id={`newPin-${targetRole}`}
            inputMode="numeric"
            maxLength={6}
            autoComplete="new-password"
            placeholder="••••"
            {...form.register("newPin")}
          />
        </FormField>

        <FormField
          label="Confirm New PIN"
          htmlFor={`confirmPin-${targetRole}`}
          required
          error={form.formState.errors.confirmPin?.message}
        >
          <PasswordInput
            id={`confirmPin-${targetRole}`}
            inputMode="numeric"
            maxLength={6}
            autoComplete="new-password"
            placeholder="••••"
            {...form.register("confirmPin")}
          />
        </FormField>
      </div>

      <FormField
        label="Current Super Admin Password"
        htmlFor={`currentPassword-${targetRole}`}
        required
        error={form.formState.errors.currentPassword?.message}
      >
        <PasswordInput
          id={`currentPassword-${targetRole}`}
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

      <div className="flex justify-end pt-2 border-t">
        <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
          {updateMutation.isPending ? (
            <>
              <Spinner size="sm" className="text-white" /> Updating PIN...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" /> Save {meta.badge} Gate PIN
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function AdminSecurityContent() {
  const [activeRoleTab, setActiveRoleTab] = useState<GatePinRole>("ADMIN");

  const {
    data: gateConfig,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin", "security", "gate-config"],
    queryFn: () => adminService.getGateConfig(),
    staleTime: 30_000,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Mobile App Security & Gate PINs
              </h1>
              <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 text-xs font-semibold">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage companion mobile app Gate PIN protection for Super Admin and Sub-Admin accounts.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Unable to load Gate PIN configuration from server. Verify Super Admin authorization.</span>
        </div>
      )}

      {/* Gate Config Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GateStatusCard
          status={gateConfig?.admin ?? { targetRole: "ADMIN", configured: false, updatedAt: null }}
          isLoading={isLoading}
        />
        <GateStatusCard
          status={gateConfig?.subAdmin ?? { targetRole: "SUB_ADMIN", configured: false, updatedAt: null }}
          isLoading={isLoading}
        />
      </div>

      {/* Role PIN Management Tabs */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Update Mobile App Gate PIN
          </CardTitle>
          <CardDescription>
            Choose the target role below and verify your current Super Admin password to set a new PIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeRoleTab} onValueChange={(v) => setActiveRoleTab(v as GatePinRole)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ADMIN" className="text-xs sm:text-sm font-semibold">
                Super Admin Gate PIN (ADMIN)
              </TabsTrigger>
              <TabsTrigger value="SUB_ADMIN" className="text-xs sm:text-sm font-semibold">
                Sub-Admin Gate PIN (SUB_ADMIN)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ADMIN">
              <GatePinUpdateForm targetRole="ADMIN" />
            </TabsContent>
            <TabsContent value="SUB_ADMIN">
              <GatePinUpdateForm targetRole="SUB_ADMIN" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
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

