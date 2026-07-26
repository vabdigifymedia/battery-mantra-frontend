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
import { ShieldAlert, Fingerprint } from "lucide-react";

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

export const Route = createFileRoute("/admin_/login")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/admin/login"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: "Admin Sign in — BatteryMantra",
      description: "Sign in to your Admin account.",
    }),
  component: LoginPage,
});

import { decodeJwt } from "@/lib/auth/jwt";
import { ROLES, type Role } from "@/constants/roles";

function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { redirect } = useSearch({ from: "/admin_/login" });
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
              <ShieldAlert className="h-7 w-7" />
            </motion.div>
            <div className="text-center space-y-1.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Admin Portal</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to manage BatteryMantra
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
              >
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="admin@example.com"
                  autoFocus
                  className="h-11 transition-all"
                  {...form.register("username")}
                />
              </FormField>
              
              <FormField
                label="Password"
                htmlFor="password"
                required
                error={form.formState.errors.password?.message}
              >
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 transition-all"
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
                <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {serverError}
                </p>
              </motion.div>
            ) : null}

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
              <Button 
                type="submit" 
                variant="brand"
                className="w-full h-11 text-base font-semibold shadow-md transition-all relative overflow-hidden group" 
                disabled={submitting}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-12 group-hover:animate-shimmer" />
                {submitting ? <Spinner size="sm" className="text-white" /> : "Sign in to Dashboard"}
              </Button>
            </motion.div>
          </form>

        </div>
        
        <p className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} BatteryMantra. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
