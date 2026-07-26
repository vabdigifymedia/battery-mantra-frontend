import { createFileRoute, Link, useRouter, useSearch } from "@tanstack/react-router";
import { OtpLoginForm } from "@/components/auth/OtpLoginForm";
import { z } from "zod";
import { pageSeoQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/_auth/login")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/login"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: "Sign in — BatteryMantra",
      description: "Sign in to your BatteryMantra account with OTP.",
    }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = useSearch({ from: "/_auth/login" });

  const handleSuccess = () => {
    if (redirect) {
      router.navigate({ to: redirect as any, replace: true });
    } else {
      router.navigate({ to: "/", replace: true });
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] mt-10 mb-20 px-4 sm:px-0">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Login or Register</h1>
        <p className="text-sm text-muted-foreground">
          Enter your mobile number to receive an OTP
        </p>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-lg p-6">
        <OtpLoginForm onSuccess={handleSuccess} />
      </div>

      <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link to="/terms-and-conditions" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">Are you a Partner or Admin?</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link to="/partner/login" className="text-brand font-medium hover:underline">
            Partner Login
          </Link>
          <Link to="/admin/login" className="text-brand font-medium hover:underline">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
