import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddressSelector } from "@/components/checkout/AddressSelector";
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
  const [deliveryMethod, setDeliveryMethod] = useState<string>("STANDARD_DELIVERY");
  const [installationDate, setInstallationDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");

  const checkout = useMutation({
    mutationFn: () => ordersService.checkout({ 
      addressId, 
      deliveryMethod, 
      installationDate: deliveryMethod === "HOME_INSTALLATION" ? installationDate : undefined 
    }),
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
  const subtotal = cart.data?.subTotal ?? items.reduce((s, it) => s + it.product.productPrice * it.quantity, 0);
  const exchangeDiscount = cart.data?.exchangeDiscount ?? 0;
  const totalAmount = cart.data?.totalAmount ?? subtotal;

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
    /^[0-9a-fA-F-]{36}$/.test(addressId) && 
    items.length > 0 && 
    !checkout.isPending && 
    (deliveryMethod !== "HOME_INSTALLATION" || installationDate !== "");

  return (
    <div>
      <PageHeader title="Checkout" description="Confirm delivery, payment and review your order." />
      <Container size="xl" className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">Delivery address</h2>
            <AddressSelector value={addressId} onChange={setAddressId} />
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

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">Delivery Method</h2>
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="space-y-4">
              <div className="flex items-start space-x-3 rounded-xl border border-border p-4 hover:border-primary/50">
                <RadioGroupItem value="STANDARD_DELIVERY" id="delivery-standard" className="mt-1" />
                <Label htmlFor="delivery-standard" className="cursor-pointer font-medium flex-1">
                  <div>Standard Delivery</div>
                  <div className="text-muted-foreground text-xs font-normal mt-1">Free delivery within 3-5 business days.</div>
                </Label>
              </div>
              <div className="flex items-start space-x-3 rounded-xl border border-border p-4 hover:border-primary/50">
                <RadioGroupItem value="STORE_PICKUP" id="delivery-pickup" className="mt-1" />
                <Label htmlFor="delivery-pickup" className="cursor-pointer font-medium flex-1">
                  <div>Store Pickup</div>
                  <div className="text-muted-foreground text-xs font-normal mt-1">Pick up your battery from our nearest partner garage.</div>
                </Label>
              </div>
              <div className="flex items-start space-x-3 rounded-xl border border-border p-4 hover:border-primary/50">
                <RadioGroupItem value="HOME_INSTALLATION" id="delivery-install" className="mt-1" />
                <Label htmlFor="delivery-install" className="cursor-pointer font-medium flex-1">
                  <div>Home Installation</div>
                  <div className="text-muted-foreground text-xs font-normal mt-1">A technician will arrive at your location to install the battery.</div>
                  
                  {deliveryMethod === "HOME_INSTALLATION" && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="install-date" className="mb-1.5 block text-xs">Select Installation Date</Label>
                      <Input 
                        id="install-date" 
                        type="date" 
                        className="bg-background max-w-[200px]"
                        min={new Date().toISOString().split('T')[0]}
                        value={installationDate}
                        onChange={(e) => setInstallationDate(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </Label>
              </div>
            </RadioGroup>
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
            {exchangeDiscount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Scrap Discount</dt>
                <dd className="font-medium">
                  -<Price value={exchangeDiscount} size="sm" />
                </dd>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold">Total</dt>
              <dd>
                <Price value={totalAmount} size="md" />
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
