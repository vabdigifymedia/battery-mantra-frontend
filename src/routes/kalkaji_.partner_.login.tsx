import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { Spinner } from "@/components/feedback/Spinner";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UsersRound, Smartphone, KeyRound, ArrowLeft } from "lucide-react";
import { pageSeoQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { decodeJwt } from "@/lib/auth/jwt";
import { ROLES, type Role } from "@/constants/roles";

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter a valid 10-digit registered partner mobile number"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, "Enter the 4 to 6 digit OTP"),
});

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/kalkaji_/partner_/login")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/kalkaji/partner/login"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: "Partner Sign in — BatteryMantra",
      description: "Sign in to your Partner account using your registered phone number and OTP.",
      noIndex: true,
    }),
  component: PartnerOtpLoginPage,
});

function resolveVerifiedRole(resRole: string | undefined, token: string): string {
  const jwtPayload = decodeJwt(token);
  if (jwtPayload) {
    const rawRoles =
      (jwtPayload.roles as string[] | undefined) ??
      (jwtPayload.authorities as string[] | undefined) ??
      (typeof jwtPayload.role === "string" ? [jwtPayload.role] : []);
    const parsedRoles = rawRoles
      .map((r) => r.replace(/^ROLE_/, "").toUpperCase())
      .filter((r): r is Role => (Object.values(ROLES) as string[]).includes(r));
    if (parsedRoles.length > 0) {
      return parsedRoles[0];
    }
  }
  return (resRole || "").replace(/^ROLE_/, "").toUpperCase();
}

function PartnerOtpLoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { redirect } = useSearch({ from: "/kalkaji_/partner_/login" });

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "otp" || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onSendOtp = phoneForm.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await authService.partnerSendOtp({ phoneNumber: values.phoneNumber });
      setPhoneNumber(values.phoneNumber);
      otpForm.reset({ otp: "" });
      setStep("otp");
      setResendTimer(30);
      toast.success("OTP sent to your registered partner number");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to send OTP. Verify your registered partner number.";
      setServerError(msg);
      toast.error(msg);
    }
  });

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading || !phoneNumber) return;
    setResendLoading(true);
    setServerError(null);
    try {
      await authService.partnerSendOtp({ phoneNumber });
      setResendTimer(30);
      toast.success("OTP resent successfully");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to resend OTP.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setResendLoading(false);
    }
  };

  const onVerifyOtp = otpForm.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await authService.partnerVerifyOtp({ phoneNumber, otp: values.otp });
      const verifiedRole = resolveVerifiedRole(res.role, res.token);

      if (verifiedRole !== ROLES.PARTNER) {
        setServerError("Access denied. This portal is restricted to registered Partner accounts.");
        return;
      }

      setSession(res.token, res.refreshToken, {
        id: res.id,
        username: res.name || phoneNumber,
        phoneNumber,
        roles: [ROLES.PARTNER],
      });
      toast.success("Welcome back to Partner Portal");

      if (redirect && redirect.startsWith("/kalkaji/partner")) {
        const [path, query] = redirect.split("?");
        if (query) {
          const params = Object.fromEntries(new URLSearchParams(query));
          router.navigate({ to: path as any, search: params as any, replace: true });
        } else {
          router.navigate({ to: path as any, replace: true });
        }
      } else {
        router.navigate({ to: "/kalkaji/partner" as any, replace: true });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Invalid or expired OTP. Please try again.";
      setServerError(msg);
    }
  });

  const submittingPhone = phoneForm.formState.isSubmitting;
  const submittingOtp = otpForm.formState.isSubmitting;

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-slate-50/50">
      {/* Subtle brand background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70vw] h-[70vw] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[10%] w-[70vw] h-[70vw] bg-gradient-to-t from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] p-4"
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8 space-y-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2 shadow-sm ring-1 ring-primary/20"
            >
              <UsersRound className="h-7 w-7" />
            </motion.div>
            <div className="text-center space-y-1.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Partner Portal</h1>
              <p className="text-sm text-muted-foreground">
                {step === "phone"
                  ? "Sign in with your registered partner mobile number"
                  : `Enter the verification OTP sent to +91 ${phoneNumber}`}
              </p>
            </div>
          </div>

          {step === "phone" ? (
            <form onSubmit={onSendOtp} className="space-y-5" noValidate>
              <FormField
                label="Registered Partner Mobile Number"
                htmlFor="partner-phone"
                required
                error={phoneForm.formState.errors.phoneNumber?.message}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-11 items-center gap-1.5 rounded-md border bg-muted/50 px-3 text-sm font-medium text-muted-foreground shrink-0">
                    <Smartphone className="h-4 w-4" />
                    <span>+91</span>
                  </div>
                  <Input
                    id="partner-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel-national"
                    placeholder="10-digit mobile number"
                    autoFocus
                    className="h-11 tracking-wide"
                    {...phoneForm.register("phoneNumber")}
                  />
                </div>
              </FormField>

              {serverError ? (
                <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {serverError}
                </p>
              ) : null}

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-1">
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full h-11 text-base font-semibold shadow-md transition-all"
                  disabled={submittingPhone}
                >
                  {submittingPhone ? <Spinner size="sm" className="text-white" /> : "Send OTP"}
                </Button>
              </motion.div>
            </form>
          ) : (
            <form onSubmit={onVerifyOtp} className="space-y-5" noValidate>
              <div className="flex items-center justify-between text-xs bg-muted/40 border rounded-lg px-3 py-2.5">
                <span className="text-muted-foreground">
                  Mobile: <strong className="text-foreground font-mono">+91 {phoneNumber}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setServerError(null);
                  }}
                  className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" /> Change
                </button>
              </div>

              <FormField
                label="Verification OTP"
                htmlFor="partner-otp"
                required
                error={otpForm.formState.errors.otp?.message}
              >
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="partner-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="Enter OTP"
                    autoFocus
                    className="h-12 pl-9 text-center text-lg tracking-[0.3em] font-bold font-mono"
                    {...otpForm.register("otp")}
                  />
                </div>
              </FormField>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Didn&apos;t receive the OTP?</span>
                {resendTimer > 0 ? (
                  <span className="font-medium bg-muted px-2 py-1 rounded">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? "Sending..." : "Resend OTP"}
                  </button>
                )}
              </div>

              {serverError ? (
                <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {serverError}
                </p>
              ) : null}

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-1">
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full h-11 text-base font-semibold shadow-md transition-all"
                  disabled={submittingOtp}
                >
                  {submittingOtp ? <Spinner size="sm" className="text-white" /> : "Verify & Access Dashboard"}
                </Button>
              </motion.div>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} BatteryMantra. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
