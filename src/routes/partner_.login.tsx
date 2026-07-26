import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Spinner } from "@/components/feedback/Spinner";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { env } from "@/lib/utils/env";
import { motion } from "framer-motion";
import { BriefcaseBusiness, UsersRound } from "lucide-react";

const schema = z.object({
  username: z.string().trim().min(1, "Username, email, or phone is required"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

const searchSchema = z.object({
  redirect: z.string().optional(),
});

import { pageSeoQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/partner_/login")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/partner/login"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: "Partner Sign in — BatteryMantra",
      description: "Sign in to your Partner account.",
    }),
  component: LoginPage,
});

import { decodeJwt } from "@/lib/auth/jwt";
import { ROLES, type Role } from "@/constants/roles";

function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { redirect } = useSearch({ from: "/partner_/login" });
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const res = await authService.login(values);

      // 1) Start with the role from the API response body
      let role: string = res.role || "CUSTOMER";

      // 2) Also try to extract role from JWT token (more reliable)
      const jwtPayload = decodeJwt(res.token);
      if (jwtPayload) {
        const rawRoles =
          (jwtPayload.roles as string[] | undefined) ??
          (jwtPayload.authorities as string[] | undefined) ??
          (typeof jwtPayload.role === "string" ? [jwtPayload.role] : []);
        const parsedRoles = rawRoles
          .map((r) => r.replace(/^ROLE_/, "").toUpperCase())
          .filter((r): r is Role => (Object.values(ROLES) as string[]).includes(r));
        if (parsedRoles.length > 0) {
          role = parsedRoles[0];
        }
      }

      console.log("[LOGIN] API res.role:", res.role, "| JWT role:", jwtPayload?.role, "| Final role:", role);

      if (role === "ENGINEER") {
        setServerError("Please use the Engineer Mobile App to login.");
        return;
      }

      setSession(res.token, res.refreshToken, {
        id: res.id,
        username: values.username,
        roles: [role as Role],
      });
      toast.success("Welcome back");

      if (role === "ADMIN") {
        router.navigate({ to: "/admin" as any });
      } else if (role === "PARTNER") {
        router.navigate({ to: "/partner" as any });
      } else if (redirect) {
        const [path, query] = redirect.split("?");
        if (query) {
          const params = Object.fromEntries(new URLSearchParams(query));
          router.navigate({ to: path as any, search: params as any });
        } else {
          router.navigate({ to: path as any });
        }
      } else {
        router.navigate({ to: "/" as any });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Sign in failed. Please try again.";
      setServerError(msg);
    }
  });

  const submitting = form.formState.isSubmitting;

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0],
            opacity: [0.25, 0.45, 0.25]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-600/20 blur-[120px]"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.4, 1],
            rotate: [0, 90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-teal-600/20 blur-[100px]"
        />
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          
          <div className="flex flex-col items-center mb-8 space-y-4">
            <motion.div 
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30"
            >
              <UsersRound className="h-8 w-8 text-white" />
            </motion.div>
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">Partner Portal</h1>
              <p className="text-sm text-slate-400 font-medium flex items-center justify-center gap-1.5">
                <BriefcaseBusiness className="w-4 h-4 text-emerald-400" />
                Business Operations
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-4">
              <FormField
                label="Username, Email or Phone"
                htmlFor="username"
                required
                error={form.formState.errors.username?.message}
                className="text-slate-200"
              >
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="partner@example.com"
                  autoFocus
                  className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-white/10 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-200"
                  {...form.register("username")}
                />
              </FormField>
              
              <FormField
                label="Password"
                htmlFor="password"
                required
                error={form.formState.errors.password?.message}
                className="text-slate-200"
              >
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-white/10 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-200"
                  {...form.register("password")}
                />
              </FormField>
            </div>

            {serverError ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
                  {serverError}
                </p>
              </motion.div>
            ) : null}

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300 relative overflow-hidden group border-0" 
                disabled={submitting}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[150%] skew-x-12 group-hover:animate-shimmer" />
                {submitting ? <Spinner className="text-white" /> : "Access Dashboard"}
              </Button>
            </motion.div>
          </form>

        </div>
      </motion.div>
    </div>
  );
}
