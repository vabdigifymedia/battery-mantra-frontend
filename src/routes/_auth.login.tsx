
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

      // Since the backend doesn't return the role in the JWT or login response,
      // we probe an admin endpoint to check if the user is an ADMIN.
      let role = "CUSTOMER";
      try {
        const probeRes = await fetch("http://localhost:8080/api/admin/users", {
          method: "GET",
          headers: { Authorization: `Bearer ${res.token}` },
        });
        if (probeRes.ok) {
          role = "ADMIN";
        }
      } catch (e) {
        // ignore
      }

      setSession(res.token, {
        id: res.id,
        username: values.username,
        roles: [role as "ADMIN" | "CUSTOMER"],
      });
      toast.success("Welcome back");

      if (redirect) {
        const [path, query] = redirect.split("?");
        if (query) {
          const params = Object.fromEntries(new URLSearchParams(query));
          router.navigate({ to: path as any, search: params });
        } else {
          router.navigate({ to: path as any });
        }
      } else if (role === "ADMIN") {
        router.navigate({ to: "/admin" as any });
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
