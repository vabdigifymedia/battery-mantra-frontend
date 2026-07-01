import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { Price } from "@/components/common/Price";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Spinner } from "@/components/feedback/Spinner";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { useAuth } from "@/providers/AuthProvider";
import { cartQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { ordersService } from "@/services/orders.service";
import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";

const searchSchema = z.object({
  addressId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — BatteryMantra" },
      { name: "description", content: "Review your order and place it securely." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  validateSearch: searchSchema,
  component: CheckoutPage,
});

function CheckoutPage() {
  const { status } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cart = useQuery(cartQuery(status === "authenticated"));
  const [addressId, setAddressId] = useState<string>(search.addressId ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");

  const checkout = useMutation({
    mutationFn: () => ordersService.checkout({ addressId }),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success("Order placed");
      navigate({ to: "/orders/$orderId", params: { orderId: order.orderId } });
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Could not place order."),
  });

  if (status === "loading") return <FullPageLoader />;
  if (status !== "authenticated")
    return <Navigate to="/login" search={{ redirect: "/checkout" }} />;

  const items = cart.data?.cartItems ?? [];
  const subtotal = items.reduce((s, it) => s + it.product.productPrice * it.quantity, 0);

  if (!cart.isLoading && items.length === 0) {
    return (
      <Container size="lg" className="py-12">
        <EmptyState
          title="Your cart is empty"
          description="Add batteries before checking out."
          action={
            <Button asChild variant="brand">
              <Link to="/products">Shop batteries</Link>
            </Button>
          }
        />
      </Container>
    );
  }

  const canPlace =
    /^[0-9a-fA-F-]{36}$/.test(addressId) && items.length > 0 && !checkout.isPending;

  return (
    <div>
      <PageHeader title="Checkout" description="Confirm delivery, payment and review your order." />
      <Container size="xl" className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">Delivery address</h2>
            <FormField
              label="Address ID"
              htmlFor="addressId"
              required
              hint="Paste the ID of a saved address from your account. Address management UI is coming soon."
            >
              <Input
                id="addressId"
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
              />
            </FormField>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PaymentOption
                active={paymentMethod === "COD"}
                onClick={() => setPaymentMethod("COD")}
                icon={<Truck className="h-4 w-4" />}
                title="Cash on Delivery"
                desc="Pay when your battery is delivered and installed."
              />
              <PaymentOption
                active={paymentMethod === "ONLINE"}
                onClick={() => setPaymentMethod("ONLINE")}
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Pay Online"
                desc="You'll be handed off to a secure payment gateway."
              />
            </div>
            {paymentMethod === "ONLINE" ? (
              <p className="mt-3 rounded-md bg-primary-soft px-3 py-2 text-xs text-primary">
                Online payment will be initiated by the backend after order placement.
              </p>
            ) : null}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-product">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((it) => (
              <li key={it.cartItemId} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {it.quantity} × {it.product.productName}
                </span>
                <Price value={it.product.productPrice * it.quantity} size="sm" />
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>
                <Price value={subtotal} size="sm" />
              </dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold">Total</dt>
              <dd>
                <Price value={subtotal} size="md" />
              </dd>
            </div>
          </dl>
          <Button
            variant="brand"
            className="mt-5 w-full"
            disabled={!canPlace}
            onClick={() => checkout.mutate()}
          >
            {checkout.isPending ? <Spinner size="sm" /> : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Place order
              </>
            )}
          </Button>
        </aside>
      </Container>
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${
        active
          ? "border-primary bg-primary-soft"
          : "border-border bg-surface hover:border-primary/40"
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
