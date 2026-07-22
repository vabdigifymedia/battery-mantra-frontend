
import { createFileRoute, Link, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
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

const schema = z.object({
  username: z.string().trim().min(1, "Username, email, or phone is required"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/_auth/login")({
  head: () => ({
    meta: [
      { title: "Sign in — BatteryMantra" },
      { name: "description", content: "Sign in to your BatteryMantra account." },
    ],
  }),
  validateSearch: searchSchema,
  component: LoginPage,
});

import { decodeJwt } from "@/lib/auth/jwt";
import { ROLES, type Role } from "@/constants/roles";

function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { redirect } = useSearch({ from: "/_auth/login" });
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
          router.navigate({ to: path as any, search: params });
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-product sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome back. Enter your credentials to continue.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <FormField
          label="Username, Email or Phone"
          htmlFor="username"
          required
          error={form.formState.errors.username?.message}
        >
          <Input
            id="username"
            autoComplete="username"
            placeholder="your username or yourmail@example.com"
            autoFocus
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
            {...form.register("password")}
          />
        </FormField>

        {serverError ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}

        <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
          {submitting ? <Spinner size="sm" /> : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to BatteryMantra?{" "}
        <Link to="/register" search={{ redirect }} className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
