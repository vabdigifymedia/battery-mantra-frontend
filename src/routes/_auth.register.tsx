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
import { emailSchema, phoneInSchema, passwordSchema } from "@/lib/validation/schemas";
import { toast } from "sonner";

const schema = z.object({
  username: z.string().trim().min(3, "Minimum 3 characters"),
  email: emailSchema,
  phoneNumber: phoneInSchema,
  password: passwordSchema,
});
type Values = z.infer<typeof schema>;

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/_auth/register")({
  head: () => ({
    meta: [
      { title: "Create account — BatteryMantra" },
      { name: "description", content: "Create your BatteryMantra account." },
    ],
  }),
  validateSearch: searchSchema,
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const { redirect } = useSearch({ from: "/_auth/register" });
  const { setSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", phoneNumber: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await authService.register({ ...values, role: "CUSTOMER" });
      // Auto-login with the same credentials
      const login = await authService.login({
        username: values.username,
        password: values.password,
      });
      setSession(login.token, {
        id: login.id,
        username: values.username,
        email: values.email,
        phoneNumber: values.phoneNumber,
        roles: ["CUSTOMER"],
      });
      toast.success("Account created");
      if (redirect) {
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
      const msg = e instanceof ApiError ? e.message : "Sign up failed. Please try again.";
      setServerError(msg);
    }
  });

  const submitting = form.formState.isSubmitting;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-product sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        It only takes a minute to start shopping.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <FormField
          label="Username"
          htmlFor="username"
          required
          error={form.formState.errors.username?.message}
        >
          <Input id="username" autoComplete="username" {...form.register("username")} />
        </FormField>
        <FormField
          label="Email"
          htmlFor="email"
          required
          error={form.formState.errors.email?.message}
        >
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </FormField>
        <FormField
          label="Mobile number"
          htmlFor="phoneNumber"
          required
          error={form.formState.errors.phoneNumber?.message}
        >
          <Input
            id="phoneNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            {...form.register("phoneNumber")}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          required
          hint="Use at least 8 characters with upper, lower and a number."
          error={form.formState.errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        </FormField>

        {serverError ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}

        <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
          {submitting ? <Spinner size="sm" /> : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" search={{ redirect }} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
