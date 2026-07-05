import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, ShieldCheck, Truck, Check } from "lucide-react";
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
  const { status, user } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cart = useQuery(cartQuery(status === "authenticated"));
  
  const [activeStep, setActiveStep] = useState<number>(2);
  const [addressId, setAddressId] = useState<string>(search.addressId ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState<string>("STANDARD_DELIVERY");
  const [installationDate, setInstallationDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");

  const checkout = useMutation({
    mutationFn: () => ordersService.checkout({ 
      addressId, 
      deliveryMethod, 
      paymentMethod,
      installationDate: deliveryMethod === "HOME_INSTALLATION" ? installationDate : undefined 
    }),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success("Order placed successfully");
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

  const hasValidAddress = /^[0-9a-fA-F-]{36}$/.test(addressId);
  const hasValidDelivery = deliveryMethod !== "HOME_INSTALLATION" || installationDate !== "";
  
  const canPlace = hasValidAddress && items.length > 0 && !checkout.isPending && hasValidDelivery;

  return (
    <div className="bg-muted/20 min-h-screen pb-16">
      <PageHeader title="Secure Checkout" description="Complete your order securely." className="bg-background border-b mb-8 shadow-sm" />
      
      <Container size="xl" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        
        {/* LEFT COLUMN: ACCORDION STEPS */}
        <div className="space-y-4">
          
          {/* STEP 1: LOGIN */}
          <CheckoutStep 
            index={1} 
            title="Login" 
            active={false} 
            completed={true}
            summary={user?.email || user?.username || "Authenticated"}
          >
            {null}
          </CheckoutStep>

          {/* STEP 2: ADDRESS */}
          <CheckoutStep 
            index={2} 
            title="Delivery Address" 
            active={activeStep === 2} 
            completed={activeStep > 2}
            onEdit={() => setActiveStep(2)}
            summary={hasValidAddress ? "Address selected" : ""}
          >
            <AddressSelector value={addressId} onChange={setAddressId} />
            <div className="mt-6">
              <Button 
                variant="brand" 
                size="lg" 
                disabled={!hasValidAddress} 
                onClick={() => setActiveStep(3)}
              >
                Deliver Here
              </Button>
            </div>
          </CheckoutStep>

          {/* STEP 3: DELIVERY METHOD */}
          <CheckoutStep 
            index={3} 
            title="Delivery Method" 
            active={activeStep === 3} 
            completed={activeStep > 3}
            onEdit={() => setActiveStep(3)}
            summary={deliveryMethod.replace('_', ' ')}
          >
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="space-y-4">
              <div className={`flex items-start space-x-3 rounded-xl border p-4 transition-colors ${deliveryMethod === "STANDARD_DELIVERY" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <RadioGroupItem value="STANDARD_DELIVERY" id="delivery-standard" className="mt-1" />
                <Label htmlFor="delivery-standard" className="cursor-pointer font-medium flex-1">
                  <div>Standard Delivery</div>
                  <div className="text-muted-foreground text-xs font-normal mt-1">Free delivery within 3-5 business days.</div>
                </Label>
              </div>
              <div className={`flex items-start space-x-3 rounded-xl border p-4 transition-colors ${deliveryMethod === "STORE_PICKUP" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <RadioGroupItem value="STORE_PICKUP" id="delivery-pickup" className="mt-1" />
                <Label htmlFor="delivery-pickup" className="cursor-pointer font-medium flex-1">
                  <div>Store Pickup</div>
                  <div className="text-muted-foreground text-xs font-normal mt-1">Pick up your battery from our nearest partner garage.</div>
                </Label>
              </div>
              <div className={`flex items-start space-x-3 rounded-xl border p-4 transition-colors ${deliveryMethod === "HOME_INSTALLATION" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
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
            <div className="mt-6">
              <Button 
                variant="brand" 
                size="lg" 
                disabled={!hasValidDelivery} 
                onClick={() => setActiveStep(4)}
              >
                Continue
              </Button>
            </div>
          </CheckoutStep>

          {/* STEP 4: ORDER SUMMARY */}
          <CheckoutStep 
            index={4} 
            title="Order Summary" 
            active={activeStep === 4} 
            completed={activeStep > 4}
            onEdit={() => setActiveStep(4)}
            summary={`${items.length} item(s)`}
          >
            <div className="border rounded-xl overflow-hidden divide-y">
              {items.map((it) => (
                <div key={it.cartItemId} className="flex items-center gap-4 p-4 bg-background">
                  <div className="h-16 w-16 bg-muted rounded-md border flex items-center justify-center shrink-0">
                    {it.product.productImage ? (
                      <img src={it.product.productImage} alt={it.product.productName} className="h-full w-full object-contain p-1" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No img</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{it.product.productName}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Qty: {it.quantity}</p>
                  </div>
                  <Price value={it.product.productPrice * it.quantity} size="md" className="font-bold" />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="brand" size="lg" onClick={() => setActiveStep(5)}>
                Continue
              </Button>
            </div>
          </CheckoutStep>

          {/* STEP 5: PAYMENT OPTIONS */}
          <CheckoutStep 
            index={5} 
            title="Payment Options" 
            active={activeStep === 5} 
            completed={false}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentOption
                active={paymentMethod === "COD"}
                onClick={() => setPaymentMethod("COD")}
                icon={<Truck className="h-5 w-5" />}
                title="Cash on Delivery"
                desc="Pay when delivered."
              />
              <PaymentOption
                active={paymentMethod === "ONLINE"}
                onClick={() => setPaymentMethod("ONLINE")}
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Pay Online"
                desc="Secure gateway."
              />
            </div>
            {paymentMethod === "ONLINE" && (
              <p className="mt-4 rounded-md bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                Online payment will be initiated securely after order placement.
              </p>
            )}

            <div className="mt-8 flex justify-end pt-4 border-t">
              <Button
                variant="brand"
                size="lg"
                className="w-full sm:w-auto min-w-[200px] text-lg h-12 shadow-md shadow-brand/20"
                disabled={!canPlace}
                onClick={() => checkout.mutate()}
              >
                {checkout.isPending ? <Spinner size="sm" className="mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Place Order
              </Button>
            </div>
          </CheckoutStep>

        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
        <aside className="sticky top-24 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="bg-muted/30 border-b p-5">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wide">Price Details</h2>
          </div>
          <div className="p-5">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between text-foreground">
                <dt>Price ({items.length} items)</dt>
                <dd>
                  <Price value={subtotal} size="sm" />
                </dd>
              </div>
              
              <div className="flex justify-between text-foreground">
                <dt>Delivery Charges</dt>
                <dd className="text-success font-medium">Free</dd>
              </div>

              {exchangeDiscount > 0 && (
                <div className="flex justify-between text-success font-medium">
                  <dt>Exchange Discount</dt>
                  <dd>
                    -<Price value={exchangeDiscount} size="sm" />
                  </dd>
                </div>
              )}
              
              <div className="my-2 border-t border-dashed" />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <dt>Total Amount</dt>
                <dd>
                  <Price value={totalAmount} size="lg" />
                </dd>
              </div>
            </dl>

            {exchangeDiscount > 0 && (
              <p className="mt-6 text-xs text-success font-semibold tracking-wide uppercase">
                You will save ₹{exchangeDiscount} on this order
              </p>
            )}
            
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
            </div>
          </div>
        </aside>
      </Container>
    </div>
  );
}

// Subcomponents

function CheckoutStep({ 
  index, 
  title, 
  active, 
  completed, 
  onEdit, 
  children,
  summary
}: { 
  index: number; 
  title: string; 
  active: boolean; 
  completed: boolean; 
  onEdit?: () => void; 
  children: React.ReactNode;
  summary?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl overflow-hidden transition-all duration-300 border bg-card ${active ? 'shadow-md ring-1 ring-primary/20 border-primary' : 'border-border'}`}>
      <div 
        className={`flex items-center justify-between p-4 sm:p-5 transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'} ${completed && !active ? 'cursor-pointer hover:bg-muted/30' : ''}`}
        onClick={() => { if (completed && !active && onEdit) onEdit(); }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded text-xs sm:text-sm font-bold shrink-0 transition-colors ${active ? 'bg-background text-primary' : 'bg-muted-foreground/10 text-muted-foreground'} ${completed && !active ? 'bg-background text-primary border border-border shadow-sm' : ''}`}>
            {completed && !active ? <Check className="h-4 w-4 text-primary" /> : index}
          </div>
          <h2 className="text-base sm:text-lg font-semibold uppercase tracking-wide truncate">{title}</h2>
          {completed && !active && summary && (
            <span className="hidden sm:inline-block ml-4 text-sm font-medium text-foreground truncate opacity-80 border-l pl-4 border-border">
              {summary}
            </span>
          )}
        </div>
        {completed && !active && onEdit && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-8 ml-2">Change</Button>
        )}
      </div>

      {active && (
        <div className="p-5 sm:p-6 bg-card animate-in slide-in-from-top-2 fade-in duration-300">
          {children}
        </div>
      )}
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
      className={`rounded-xl border-2 p-4 text-left transition-colors flex items-start gap-4 ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/40 hover:bg-muted/20"
      }`}
      aria-pressed={active}
    >
      <div className={`mt-0.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
        {icon}
      </div>
      <div>
        <div className={`font-semibold ${active ? 'text-foreground' : 'text-foreground/80'}`}>
          {title}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}
