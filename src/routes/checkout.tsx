import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { z } from "zod";
import { CheckCircle2, ShieldCheck, Truck, Check, Ticket, X, AlertTriangle, MapPin, RefreshCw } from "lucide-react";
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
import { cartQuery, addressesQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { ordersService } from "@/services/orders.service";
import { couponsService } from "@/services/coupons.service";
import { useLocationStore } from "@/store/useLocationStore";
import type { ApplyCouponResponse, CityDto } from "@/types/dto";
import { paymentsService } from "@/services/payments.service";
import { loadRazorpayScript } from "@/lib/razorpay";
import { env } from "@/lib/utils/env";
import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";
import { trackPurchase } from "@/lib/analytics";
import { locationService } from "@/services/location.service";
import { LocationModal } from "@/components/location/LocationModal";

import { pageSeoQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";

const searchSchema = z.object({
  addressId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    try {
      const pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/checkout"));
      return { pageSeo };
    } catch {
      return { pageSeo: null };
    }
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: "Checkout — BatteryMantra",
      description: "Review your order and place it securely.",
    }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { status, user } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { city: locationCity, setLocation } = useLocationStore();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const [activeStep, setActiveStep] = useState<number>(2);
  const [addressId, setAddressId] = useState<string>(search.addressId ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState<string>("STANDARD_DELIVERY");
  const [installationDate, setInstallationDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");

  const { data: addresses } = useQuery(addressesQuery(status === "authenticated"));
  const selectedAddress = addresses?.find((a) => a.addressId === addressId);
  const hasValidAddress = /^[0-9a-fA-F-]{36}$/.test(addressId);
  const postalCode = selectedAddress?.postalCode?.trim() ?? "";

  // Public serviceable cities query
  const { data: publicCities } = useQuery({
    queryKey: ["locations", "public-cities"],
    queryFn: () => locationService.getPublicCities(),
  });

  // Verify serviceability of the selected address pincode
  const pincodeCheck = useQuery({
    queryKey: ["locations", "check-pincode", postalCode],
    queryFn: () => locationService.checkPincode(postalCode),
    enabled: Boolean(hasValidAddress && postalCode && postalCode.length >= 6),
    staleTime: 1000 * 60 * 5,
  });

  // Resolve destination delivery city from pincode check or public cities fallback
  const resolvedDeliveryCity: CityDto | null = useMemo(() => {
    if (!selectedAddress) return null;
    if (pincodeCheck.data?.serviceable && pincodeCheck.data?.city) {
      return pincodeCheck.data.city;
    }
    if (publicCities && selectedAddress.city) {
      const normalizedAddrCity = selectedAddress.city.trim().toLowerCase();
      const matched = publicCities.find(
        (c) => c.cityName.trim().toLowerCase() === normalizedAddrCity
      );
      if (matched) return matched;
    }
    return pincodeCheck.data?.city || null;
  }, [selectedAddress, pincodeCheck.data, publicCities]);

  // Option C: Strict serviceability check
  const isAddressServiceable: boolean = useMemo(() => {
    if (!selectedAddress) return true;
    if (pincodeCheck.data) {
      return Boolean(pincodeCheck.data.serviceable);
    }
    if (pincodeCheck.isError && publicCities && selectedAddress.city) {
      const normalizedAddrCity = selectedAddress.city.trim().toLowerCase();
      return publicCities.some((c) => c.cityName.trim().toLowerCase() === normalizedAddrCity);
    }
    return true;
  }, [selectedAddress, pincodeCheck.data, pincodeCheck.isError, publicCities]);

  const isCheckingServiceability = Boolean(
    hasValidAddress && postalCode.length >= 6 && pincodeCheck.isLoading
  );

  const isUnserviceable = Boolean(
    hasValidAddress && !isCheckingServiceability && !isAddressServiceable
  );

  // Option A: Destination city vs browsing city mismatch
  const isCityMismatch = Boolean(
    hasValidAddress &&
    !isUnserviceable &&
    resolvedDeliveryCity &&
    locationCity &&
    resolvedDeliveryCity.cityName.trim().toLowerCase() !== locationCity.cityName.trim().toLowerCase()
  );

  // Effective city for pricing: Destination Delivery City takes precedence over browsing location
  const effectiveCity = Boolean(hasValidAddress && !isUnserviceable && resolvedDeliveryCity)
    ? resolvedDeliveryCity
    : locationCity;

  // Real-time cart query fetched using effective delivery city ID
  const cart = useQuery(cartQuery(status === "authenticated", effectiveCity?.cityId));

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<ApplyCouponResponse | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleSyncBrowsingCity = () => {
    if (resolvedDeliveryCity && selectedAddress) {
      setLocation(selectedAddress.postalCode, true, resolvedDeliveryCity);
      toast.success(`Browsing location updated to ${resolvedDeliveryCity.cityName}`);
    }
  };

  const handleChangeAddress = () => {
    setActiveStep(2);
    const el = document.getElementById("checkout-step-2");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const checkout = useMutation({
    mutationFn: () => ordersService.checkout({ 
      addressId: addressId as any, 
      deliveryMethod, 
      paymentMethod,
      installationDate: deliveryMethod === "HOME_INSTALLATION" ? installationDate : undefined,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      latitude: selectedAddress?.latitude,
      longitude: selectedAddress?.longitude,
      selectedCity: effectiveCity?.cityName || locationCity?.cityName || undefined,
    }),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      trackPurchase({
        orderId: order.orderId,
        totalAmount: order.totalAmount || 0,
        items: (order as any).orderItems || [],
      });
      toast.success("Order placed successfully");
      navigate({ to: "/orders/$orderId", params: { orderId: order.orderId } });
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Could not place order."),
  });

  const createRazorpayOrder = useMutation({
    mutationFn: () => paymentsService.createRazorpayOrder({
      addressId: addressId as any,
      deliveryMethod,
      installationDate: deliveryMethod === "HOME_INSTALLATION" ? installationDate : undefined,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      latitude: selectedAddress?.latitude,
      longitude: selectedAddress?.longitude,
      selectedCity: effectiveCity?.cityName || locationCity?.cityName || undefined,
    }),
  });

  const verifyRazorpayPayment = useMutation({
    mutationFn: (body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
      paymentsService.verifyPayment(body),
  });

  const handlePlaceOrder = async () => {
    if (isUnserviceable) {
      toast.error("Delivery is unavailable for the selected address.");
      return;
    }

    if (paymentMethod === "COD") {
      checkout.mutate();
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error("Could not load Razorpay SDK. Please check your internet connection.");
      return;
    }

    try {
      const orderRes = await createRazorpayOrder.mutateAsync();
      const razorpayKey = orderRes.keyId || env.RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        toast.error("Payment Gateway Key ID is missing. Please check backend config.");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: orderRes.amount,
        currency: orderRes.currency || "INR",
        name: "Battery Mantra",
        description: "Order Payment",
        order_id: orderRes.razorpayOrderId,
        prefill: {
          name: user?.username || "Customer",
          email: user?.email || "",
          contact: user?.phoneNumber || "",
        },
        theme: {
          color: "#dc2626",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await verifyRazorpayPayment.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            qc.invalidateQueries({ queryKey: queryKeys.cart.all });
            qc.invalidateQueries({ queryKey: queryKeys.orders.all });
            trackPurchase({
              orderId: verifyRes.orderId || orderRes.orderId,
              totalAmount: orderRes.amount ? orderRes.amount / 100 : 0,
              items: items.map((it: any) => ({
                id: it.product.productId,
                name: it.product.productName,
                price: it.product.productPrice,
                quantity: it.quantity,
              })),
            });
            toast.success("Payment successful! Order confirmed.");
            navigate({ to: "/orders/$orderId", params: { orderId: verifyRes.orderId || orderRes.orderId } });
          } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not initiate payment.");
    }
  };

  if (status === "loading") return <FullPageLoader />;
  if (status !== "authenticated")
    return <Navigate to="/login" search={{ redirect: "/checkout" }} />;

  const items = cart.data?.cartItems ?? [];
  const subtotal = cart.data?.subTotal ?? items.reduce((s, it) => s + it.product.productPrice * it.quantity, 0);
  const exchangeDiscount = cart.data?.exchangeDiscount ?? 0;
  const baseTotalAmount = cart.data?.totalAmount ?? subtotal;
  
  const totalAmount = appliedCoupon
    ? Math.max(0, baseTotalAmount - (appliedCoupon.discountAmount ?? 0))
    : baseTotalAmount;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const res = await couponsService.applyCoupon({ code: couponInput.trim().toUpperCase(), cartTotal: baseTotalAmount });
      if (res.isValid) {
        setAppliedCoupon({ ...res, code: couponInput.trim().toUpperCase() });
        toast.success(res.message || "Coupon applied successfully");
      } else {
        toast.error(res.message || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to apply coupon");
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.success("Coupon removed");
  };

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

  const hasValidDelivery = deliveryMethod !== "HOME_INSTALLATION" || installationDate !== "";
  
  const isProcessing = checkout.isPending || createRazorpayOrder.isPending || verifyRazorpayPayment.isPending;
  const canPlace = hasValidAddress && !isUnserviceable && !isCheckingServiceability && items.length > 0 && !isProcessing && hasValidDelivery;

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
            summary={
              hasValidAddress
                ? isUnserviceable
                  ? "Delivery Unavailable"
                  : resolvedDeliveryCity?.cityName
                  ? `${resolvedDeliveryCity.cityName} (${selectedAddress?.postalCode})`
                  : "Address selected"
                : ""
            }
          >
            <AddressSelector value={addressId} onChange={setAddressId} />

            {/* Serviceability / Price Adjustment Notices */}
            {hasValidAddress && (
              <div className="mt-5 space-y-4">
                {isCheckingServiceability && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-muted bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                    <Spinner size="sm" />
                    <span>Verifying delivery network serviceability for {postalCode}...</span>
                  </div>
                )}

                {isUnserviceable && (
                  <ServiceabilityWarningCTA
                    postalCode={selectedAddress?.postalCode}
                    cityName={selectedAddress?.city}
                    onChangeAddress={handleChangeAddress}
                    onViewCities={() => setIsLocationModalOpen(true)}
                  />
                )}

                {isCityMismatch && resolvedDeliveryCity && (
                  <DestinationPricingNoticeCTA
                    deliveryCityName={resolvedDeliveryCity.cityName}
                    browsingCityName={locationCity?.cityName}
                    postalCode={selectedAddress?.postalCode}
                    onSyncLocation={handleSyncBrowsingCity}
                    onChangeAddress={handleChangeAddress}
                  />
                )}
              </div>
            )}

            <div className="mt-6">
              <Button 
                variant="brand" 
                size="lg" 
                disabled={!hasValidAddress || isUnserviceable || isCheckingServiceability} 
                onClick={() => setActiveStep(3)}
              >
                {isCheckingServiceability ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Checking Area...
                  </>
                ) : isUnserviceable ? (
                  "Delivery Unavailable"
                ) : (
                  "Deliver Here"
                )}
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

            {isUnserviceable && (
              <div className="mt-6">
                <ServiceabilityWarningCTA
                  postalCode={selectedAddress?.postalCode}
                  cityName={selectedAddress?.city}
                  onChangeAddress={handleChangeAddress}
                  onViewCities={() => setIsLocationModalOpen(true)}
                />
              </div>
            )}

            <div className="mt-8 flex justify-end pt-4 border-t">
              <Button
                variant="brand"
                size="lg"
                className="w-full sm:w-auto min-w-[200px] text-lg h-12 shadow-md shadow-brand/20"
                disabled={!canPlace}
                onClick={handlePlaceOrder}
              >
                {isProcessing ? <Spinner size="sm" className="mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                {isUnserviceable
                  ? "Delivery Unavailable"
                  : isCheckingServiceability
                  ? "Checking Serviceability..."
                  : paymentMethod === "ONLINE"
                  ? "Pay Now"
                  : "Place Order"}
              </Button>
            </div>
          </CheckoutStep>

        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
        <aside className="sticky top-24 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="bg-muted/30 border-b p-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wide">Price Details</h2>
            {effectiveCity && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {effectiveCity.cityName}
              </span>
            )}
          </div>
          <div className="p-5">
            {/* Context Notices in Summary */}
            {isUnserviceable && (
              <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50/80 p-3 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span>Delivery Unavailable</span>
                </div>
                <p className="mt-1 text-[11px] text-rose-800 dark:text-rose-300">
                  Pincode {selectedAddress?.postalCode} is outside our active delivery area.
                </p>
                <button
                  type="button"
                  onClick={handleChangeAddress}
                  className="mt-2 font-semibold text-rose-700 underline underline-offset-2 dark:text-rose-400 block"
                >
                  Change delivery address
                </button>
              </div>
            )}

            {!isUnserviceable && isCityMismatch && resolvedDeliveryCity && (
              <div className="mb-4">
                <DestinationPricingNoticeCTA
                  compact
                  deliveryCityName={resolvedDeliveryCity.cityName}
                  browsingCityName={locationCity?.cityName}
                  postalCode={selectedAddress?.postalCode}
                  onSyncLocation={handleSyncBrowsingCity}
                  onChangeAddress={handleChangeAddress}
                />
              </div>
            )}

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

              {!appliedCoupon ? (
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="Enter Coupon Code" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="uppercase h-9"
                  />
                  <Button variant="secondary" size="sm" className="h-9 shrink-0" onClick={handleApplyCoupon} disabled={!couponInput.trim() || isApplyingCoupon}>
                    {isApplyingCoupon ? <Spinner size="sm" /> : "Apply"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{appliedCoupon.code}</span>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Coupon Applied</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-success">-<Price value={appliedCoupon.discountAmount} size="sm" /></span>
                    <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Serviceable Locations Explorer Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
}

// Subcomponents

function ServiceabilityWarningCTA({
  postalCode,
  cityName,
  onChangeAddress,
  onViewCities,
}: {
  postalCode?: string;
  cityName?: string;
  onChangeAddress: () => void;
  onViewCities: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/80 p-5 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/20 animate-in fade-in slide-in-from-top-1">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-200/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-900 dark:bg-rose-900/60 dark:text-rose-200">
            Delivery Unavailable
          </div>
          <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">
            We do not deliver to this address yet
          </h3>
          <p className="text-sm leading-relaxed text-rose-800 dark:text-rose-300">
            Our technician dispatch and battery installation network does not currently cover{" "}
            <span className="font-semibold text-rose-950 dark:text-rose-100">
              {postalCode ? `Pincode ${postalCode}` : ""} {cityName ? `(${cityName})` : ""}
            </span>
            . Please select another delivery address or check our active service cities.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={onChangeAddress}
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              Change Delivery Address
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewCities}
              className="border-rose-300 text-rose-900 hover:bg-rose-100/60 dark:border-rose-800 dark:text-rose-200"
            >
              View Serviceable Cities
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DestinationPricingNoticeCTA({
  deliveryCityName,
  browsingCityName,
  postalCode,
  onSyncLocation,
  onChangeAddress,
  compact = false,
}: {
  deliveryCityName: string;
  browsingCityName?: string;
  postalCode?: string;
  onSyncLocation: () => void;
  onChangeAddress?: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-blue-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-900 dark:bg-blue-900/60 dark:text-blue-200">
                Destination Pricing
              </span>
            </div>
            <p className="mt-1 text-xs text-blue-900 dark:text-blue-200 font-medium">
              Prices recalculated for <span className="font-bold">{deliveryCityName}</span> delivery
              {browsingCityName ? ` (browsing from ${browsingCityName})` : ""}.
            </p>
            <button
              type="button"
              onClick={onSyncLocation}
              className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 underline underline-offset-2 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Set {deliveryCityName} as default city
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-card p-5 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20 animate-in fade-in slide-in-from-top-1">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 shadow-xs">
          <MapPin className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-200/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:bg-blue-900/60 dark:text-blue-200">
            Pricing Updated For {deliveryCityName}
          </div>
          <h3 className="text-base font-bold text-foreground">
            Order total adjusted for your delivery destination
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Battery prices, scrap exchange discounts, and technician dispatch are based on inventory in{" "}
            <span className="font-semibold text-foreground">{deliveryCityName}</span>
            {postalCode ? ` (${postalCode})` : ""} rather than{" "}
            <span className="font-semibold text-foreground">{browsingCityName || "your browsing city"}</span>.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={onSyncLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Set {deliveryCityName} as Browsing City
            </Button>
            {onChangeAddress && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onChangeAddress}
                className="border-border text-foreground hover:bg-muted"
              >
                Change Address
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div id={`checkout-step-${index}`} className={`rounded-xl overflow-hidden transition-all duration-300 border bg-card ${active ? 'shadow-md ring-1 ring-primary/20 border-primary' : 'border-border'}`}>
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

