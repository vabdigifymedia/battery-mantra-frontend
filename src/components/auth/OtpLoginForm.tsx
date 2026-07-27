import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { Spinner } from "@/components/feedback/Spinner";
import { ROLES, type Role } from "@/constants/roles";
import { decodeJwt } from "@/lib/auth/jwt";

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, "Enter the 4-digit OTP"),
});

export function OtpLoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const { setSession } = useAuth();

  useEffect(() => {
    let interval: any = null;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
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
    setLoading(true);
    try {
      await authService.sendOtp({ phoneNumber: values.phoneNumber });
      setPhoneNumber(values.phoneNumber);
      setStep("otp");
      setResendTimer(30);
      toast.success("OTP sent successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  });

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await authService.sendOtp({ phoneNumber });
      toast.success("OTP resent successfully");
      setResendTimer(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const onVerifyOtp = otpForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const res = await authService.verifyOtp({ phoneNumber, otp: values.otp });
      let role = res.role || "CUSTOMER";
      const jwtPayload = decodeJwt(res.token);
      if (jwtPayload) {
        const rawRoles = (jwtPayload.roles as string[]) ?? [];
        const parsedRoles = rawRoles
          .map((r) => r.replace(/^ROLE_/, "").toUpperCase())
          .filter((r): r is Role => (Object.values(ROLES) as string[]).includes(r));
        if (parsedRoles.length > 0) {
          role = parsedRoles[0];
        }
      }

      setSession(res.token, res.refreshToken, {
        id: res.id,
        username: phoneNumber,
        roles: [role as Role],
      });
      
      toast.success("Login successful");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  });

  if (step === "phone") {
    return (
      <form onSubmit={onSendOtp} className="space-y-4">
        <FormField label="Phone Number" error={phoneForm.formState.errors.phoneNumber?.message}>
          <Input
            {...phoneForm.register("phoneNumber")}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            className="h-12"
          />
        </FormField>
        <Button type="submit" className="w-full h-12 text-md" disabled={loading}>
          {loading ? <Spinner className="mr-2" /> : null}
          Send OTP
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onVerifyOtp} className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        OTP sent to <span className="font-semibold text-foreground">+91 {phoneNumber}</span>.{" "}
        <button type="button" onClick={() => setStep("phone")} className="text-brand hover:underline font-medium">
          Change
        </button>
      </div>

      <FormField label="Enter OTP" error={otpForm.formState.errors.otp?.message}>
        <Input
          {...otpForm.register("otp")}
          placeholder="4-digit OTP"
          maxLength={4}
          className="h-12 text-center text-lg tracking-widest font-semibold"
        />
      </FormField>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>Didn't receive the OTP?</span>
        {resendTimer > 0 ? (
          <span className="font-medium text-muted-foreground bg-muted px-2 py-1 rounded">Resend in {resendTimer}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendLoading}
            className="font-semibold text-brand hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        )}
      </div>

      <Button type="submit" className="w-full h-12 text-md mt-2" disabled={loading}>
        {loading ? <Spinner className="mr-2" /> : null}
        Verify & Login
      </Button>
    </form>
  );
}
