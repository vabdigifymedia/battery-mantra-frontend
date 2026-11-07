import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { CheckCircle2, ShieldCheck, Truck, Check, Ticket, X, AlertTriangle, MapPin, RefreshCw, Sparkles, Clock, Calendar, Trash2, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import { Price } from "@/components/common/Price";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Spinner } from "@/components/feedback/Spinner";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { useAuth } from "@/providers/AuthProvider";
import { cartQuery, addressesQuery, activeCampaignsQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { ordersService } from "@/services/orders.service";
import { couponsService } from "@/services/coupons.service";
import { validateCartCouponEligibility, enrichCouponWithTargeting } from "@/lib/coupon-rules";
import { campaignService } from "@/services/campaign.service";
import { cartService } from "@/services/cart.service";
import { isProductEligibleForCampaign, calculateProductCampaignDiscount, compareCampaignPriority } from "@/lib/campaign-utils";
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
import { matchCity } from "@/lib/cityMatcher";

import { pageSeoQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";

const searchSchema = z
  .object({
    addressId: z.string().optional().catch(undefined),
  })
  .catch({});

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
      noIndex: true,
    }),
  errorComponent: ({ error, reset }) => (
    <Container size="lg" className="py-16">
      <ErrorState
        title="Unable to load checkout"
        description="There was an issue loading your checkout session. Please refresh or try again."
        onRetry={reset}
      />
    </Container>
  ),
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

  // Same-Day Delivery / Home Installation Cutoff: 7:00 PM (19:00 IST)
  // After 7:00 PM, same-day delivery/installation is closed; earliest slot is tomorrow.
  const deliveryCutoffInfo = useMemo(() => {
    const now = new Date();
    const istFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = istFormatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = parseInt(getPart("hour"), 10);
    const today = `${year}-${month}-${day}`;

    const getOffsetDate = (offsetDays: number) => {
      const d = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
      const p = istFormatter.formatToParts(d);
      const gp = (type: string) => p.find((x) => x.type === type)?.value || "";
      return `${gp("year")}-${gp("month")}-${gp("day")}`;
    };

    const tomorrow = getOffsetDate(1);
    const dayAfter = getOffsetDate(2);
    const isAfterCutoff = hour >= 19; // 7:00 PM cutoff

    return {
      hour,
      today,
      tomorrow,
      dayAfter,
      isAfterCutoff,
      minInstallationDate: isAfterCutoff ? tomorrow : today,
    };
  }, []);

  // Pre-fill / adjust installation date when Home Installation is chosen
  useEffect(() => {
    if (deliveryMethod === "HOME_INSTALLATION") {
      if (!installationDate || installationDate < deliveryCutoffInfo.minInstallationDate) {
        setInstallationDate(deliveryCutoffInfo.minInstallationDate);
      }
    }
  }, [deliveryMethod, deliveryCutoffInfo.minInstallationDate, installationDate]);

  const { data: addresses } = useQuery(addressesQuery(status === "authenticated"));
  const selectedAddress = addresses?.find((a) => a.addressId === addressId);
  const hasValidAddress = /^[0-9a-fA-F-]{36}$/.test(addressId);
  const postalCode = selectedAddress?.postalCode?.trim() ?? "";

  // Auto-select default or first address if none selected
  useEffect(() => {
    if (!addressId && addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        setAddressId(defaultAddr.addressId);
      }
    }
  }, [addressId, addresses]);

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

  // Priority 1: Match the user's explicit delivery address city with public serviceable cities.
  // Handles typos, fuzzy matching, and aliases (e.g. "Noida", "Gautam Budh Nagar", "Gurugram" -> "Gurgaon", "New Delhi" -> "Delhi")
  const matchedCityByAddress = useMemo(() => {
    if (!selectedAddress?.city || !publicCities?.length) return null;
    return matchCity(selectedAddress.city, publicCities);
  }, [selectedAddress?.city, publicCities]);

  // Resolve destination delivery city:
  // 1. Matched city from customer's address takes top priority (e.g. "Noida" overrides 201301 pincode mapping)
  // 2. Fallback to city returned by pincode check if city name couldn't be resolved
  const resolvedDeliveryCity: CityDto | null = useMemo(() => {
    if (!selectedAddress) return null;
    if (matchedCityByAddress) {
      return matchedCityByAddress;
    }
    if (pincodeCheck.data?.serviceable && pincodeCheck.data?.city) {
      return pincodeCheck.data.city;
    }
    return pincodeCheck.data?.city || null;
  }, [selectedAddress, matchedCityByAddress, pincodeCheck.data]);

  // Option C: Strict serviceability check
  // If matched against a known serviceable public city, the address is confirmed serviceable
  // Otherwise, defer to pincode serviceability check
  const isAddressServiceable: boolean = useMemo(() => {
    if (!selectedAddress) return true;
    if (matchedCityByAddress) return true;
    if (pincodeCheck.data) {
      return Boolean(pincodeCheck.data.serviceable);
    }
    if (pincodeCheck.isError) {
      return false;
    }
    return true;
  }, [selectedAddress, matchedCityByAddress, pincodeCheck.data, pincodeCheck.isError]);

  const isCheckingServiceability = Boolean(
    hasValidAddress &&
    !matchedCityByAddress &&
    postalCode.length >= 6 &&
    pincodeCheck.isLoading
  );

  const isUnserviceable = Boolean(
    hasValidAddress && !isCheckingServiceability && !isAddressServiceable
  );

  // Option A: Destination city vs browsing city mismatch
  const isCityMismatch = Boolean(
    hasValidAddress &&
    !isUnserviceable &&
    resolvedDeliveryCity?.cityName &&
    locationCity?.cityName &&
    (resolvedDeliveryCity.cityId !== locationCity.cityId ||
      resolvedDeliveryCity.cityName.trim().toLowerCase() !== locationCity.cityName.trim().toLowerCase())
  );

  // Effective city for pricing: Destination Delivery City takes precedence over browsing location
  const effectiveCity = Boolean(hasValidAddress && !isUnserviceable && resolvedDeliveryCity)
    ? resolvedDeliveryCity
    : locationCity;

  // Real-time cart query fetched using effective delivery city ID
  const cart = useQuery(cartQuery(status === "authenticated", effectiveCity?.cityId));
  const { data: activeCampaigns = [] } = useQuery(activeCampaignsQuery());

  const removeCartItem = useMutation({
    mutationFn: (cartItemId: string) => cartService.remove(cartItemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      toast.success("Item removed from order");
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : "Could not remove item.");
    },
  });

  const updateCartItemQty = useMutation({
    mutationFn: ({ cartItemId, qty }: { cartItemId: string; qty: number }) =>
      cartService.update(cartItemId, { quantity: qty }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : "Could not update quantity.");
    },
  });

  const items = useMemo(() => cart.data?.cartItems ?? [], [cart.data?.cartItems]);
  const subtotal = useMemo(
    () => cart.data?.subTotal ?? items.reduce((s, it) => s + (it?.product?.productPrice ?? 0) * (it?.quantity ?? 1), 0),
    [cart.data?.subTotal, items]
  );
  const exchangeDiscount = cart.data?.exchangeDiscount ?? 0;
  const baseTotalAmount = cart.data?.totalAmount ?? subtotal;

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<ApplyCouponResponse | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Auto-fill coupon if copied from PDP
  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem("bm_copied_coupon");
      if (prefill && !couponInput) {
        setCouponInput(prefill);
      }
    } catch {
      // Ignore
    }
  }, []);

  const campaignDiscountSummary = useMemo(() => {
    if (!activeCampaigns || activeCampaigns.length === 0 || items.length === 0) {
      return { totalCampaignDiscount: 0, hasDealItems: false, eligibleCouponAmount: baseTotalAmount, campaignNames: [] };
    }

    let totalCampaignDiscount = 0;
    let dealItemsSubtotal = 0;
    const campaignNamesSet = new Set<string>();

    for (const item of items) {
      if (!item?.product) continue;
      const matched = activeCampaigns
        .filter((c) => isProductEligibleForCampaign(item.product, c))
        .sort(compareCampaignPriority)[0];

      if (matched) {
        const calc = calculateProductCampaignDiscount(item.product, matched, Boolean(item.exchangeOldBattery));
        if (calc.hasCampaignDiscount) {
          totalCampaignDiscount += calc.discountAmount * (item.quantity || 1);
          const itemBase = ((item.product.productPrice || 0) - (item.exchangeOldBattery ? (item.product.exchangeDiscount || 0) : 0)) * (item.quantity || 1);
          dealItemsSubtotal += itemBase;
          campaignNamesSet.add(matched.name);
        }
      }
    }

    const hasDealItems = totalCampaignDiscount > 0;
    const eligibleCouponAmount = Math.max(0, baseTotalAmount - dealItemsSubtotal);

    return {
      totalCampaignDiscount,
      hasDealItems,
      eligibleCouponAmount,
      campaignNames: Array.from(campaignNamesSet),
    };
  }, [activeCampaigns, items, baseTotalAmount]);

  const campaignDiscountAmount = campaignDiscountSummary.totalCampaignDiscount;
  const couponDiscountAmount = appliedCoupon?.discountAmount ?? 0;
  const totalAmount = Math.max(0, baseTotalAmount - campaignDiscountAmount - couponDiscountAmount);

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

  const handleApplyCoupon = async () => {
    const rawCode = couponInput.trim().toUpperCase();
    if (!rawCode) return;

    // Strict Anti-Stacking Check: If all cart items are already on special campaign deal
    if (campaignDiscountSummary.hasDealItems && campaignDiscountSummary.eligibleCouponAmount <= 0) {
      toast.error("Coupons cannot be applied to products already enjoying an exclusive deal.");
      return;
    }

    const evalTotal = campaignDiscountSummary.hasDealItems
      ? campaignDiscountSummary.eligibleCouponAmount
      : baseTotalAmount;

    // Target Check: Validate coupon targeting rules (categories, brands, products)
    const targetedCoupon = enrichCouponWithTargeting({
      code: rawCode,
      isActive: true,
      discountType: "FLAT",
      discountValue: 0,
    } as any);

    if (targetedCoupon.targetType && targetedCoupon.targetType !== "ALL_PRODUCTS") {
      const targetingValidation = validateCartCouponEligibility(targetedCoupon, items, evalTotal);
      if (!targetingValidation.isValid) {
        toast.error(targetingValidation.message);
        return;
      }
    }

    setIsApplyingCoupon(true);
    try {
      const res = await couponsService.applyCoupon({ code: rawCode, cartTotal: evalTotal });
      if (res.isValid) {
        setAppliedCoupon({ ...res, code: rawCode });
        try {
          sessionStorage.removeItem("bm_copied_coupon");
        } catch {
          // Ignore
        }
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
                id: it?.product?.productId || it?.cartItemId,
                name: it?.product?.productName || "Product",
                price: it?.product?.productPrice || 0,
                quantity: it?.quantity || 1,
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

  if (status === "loading" || cart.isLoading) return <FullPageLoader />;
  if (status !== "authenticated")
    return <Navigate to="/login" search={{ redirect: "/checkout" }} />;

  if (cart.isError) {
    return (
      <Container size="lg" className="py-12">
        <ErrorState
          title="Unable to load your cart"
          description="We couldn't retrieve your cart details. Please try refreshing or check back."
          onRetry={() => void cart.refetch()}
        />
      </Container>
    );
  }

  if (items.length === 0) {
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

  const hasValidDelivery =
    deliveryMethod !== "HOME_INSTALLATION" ||
    (Boolean(installationDate) && installationDate >= deliveryCutoffInfo.minInstallationDate);

  const isProcessing = checkout.isPending || createRazorpayOrder.isPending || verifyRazorpayPayment.isPending;
  const canPlace = hasValidAddress && !isUnserviceable && !isCheckingServiceability && items.length > 0 && !isProcessing && hasValidDelivery;

  return (
    <div className="bg-muted/20 min-h-screen pb-20 sm:pb-16">
      <PageHeader
        title="Secure Checkout"
        description="Complete your order securely."
        className="bg-background border-b mb-4 sm:mb-8 shadow-xs py-3.5 sm:py-6"
      />

      <Container size="xl" className="grid gap-4 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start px-3 sm:px-6">

        {/* LEFT COLUMN: ACCORDION STEPS */}
        <div className="space-y-3 sm:space-y-4">

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
              <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
                {isCheckingServiceability && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-muted bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
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

            <div className="mt-5 sm:mt-6">
              <Button
                variant="brand"
                size="lg"
                className="w-full sm:w-auto min-w-[160px]"
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
            summary={deliveryMethod === "HOME_INSTALLATION" && installationDate ? `Home Installation • ${installationDate}` : deliveryMethod.replace('_', ' ')}
          >
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="space-y-3 sm:space-y-4">
              <div className={`flex items-start space-x-3 rounded-xl border p-3.5 sm:p-4 transition-colors ${deliveryMethod === "STANDARD_DELIVERY" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <RadioGroupItem value="STANDARD_DELIVERY" id="delivery-standard" className="mt-1" />
                <Label htmlFor="delivery-standard" className="cursor-pointer font-medium flex-1">
                  <div className="text-sm sm:text-base font-semibold">Standard Delivery</div>
                  <div className="text-muted-foreground text-xs font-normal mt-0.5">
                    {deliveryCutoffInfo.isAfterCutoff
                      ? "Next-Day Delivery (Orders placed after 7 PM are dispatched next morning)"
                      : "Same-Day Delivery on Orders Before 7 PM"}
                  </div>
                </Label>
              </div>
              <div className={`flex items-start space-x-3 rounded-xl border p-3.5 sm:p-4 transition-colors ${deliveryMethod === "STORE_PICKUP" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <RadioGroupItem value="STORE_PICKUP" id="delivery-pickup" className="mt-1" />
                <Label htmlFor="delivery-pickup" className="cursor-pointer font-medium flex-1">
                  <div className="text-sm sm:text-base font-semibold">Store Pickup</div>
                  <div className="text-muted-foreground text-xs font-normal mt-0.5">Pick up your battery from our nearest partner garage.</div>
                </Label>
              </div>
              <div className={`flex items-start space-x-3 rounded-xl border p-3.5 sm:p-4 transition-colors ${deliveryMethod === "HOME_INSTALLATION" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <RadioGroupItem value="HOME_INSTALLATION" id="delivery-install" className="mt-1" />
                <div className="font-medium flex-1">
                  <Label htmlFor="delivery-install" className="cursor-pointer block">
                    <div className="text-sm sm:text-base font-semibold">Home Installation</div>
                    <div className="text-muted-foreground text-xs font-normal mt-0.5">A technician will arrive at your location to install the battery.</div>
                  </Label>

                  {deliveryMethod === "HOME_INSTALLATION" && (
                    <div className="mt-3.5 animate-in fade-in slide-in-from-top-2 space-y-3">
                      <div>
                        <Label htmlFor="install-date" className="mb-2 block text-xs font-semibold text-foreground">
                          Select Installation Date
                        </Label>

                        {/* Quick date selector pills */}
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                          {/* Today */}
                          <button
                            type="button"
                            disabled={deliveryCutoffInfo.isAfterCutoff}
                            onClick={() => setInstallationDate(deliveryCutoffInfo.today)}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5",
                              deliveryCutoffInfo.isAfterCutoff
                                ? "opacity-50 cursor-not-allowed bg-muted/60 text-muted-foreground line-through border-border"
                                : installationDate === deliveryCutoffInfo.today
                                ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "border-border bg-background hover:bg-muted/50 text-foreground"
                            )}
                          >
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Today</span>
                            {deliveryCutoffInfo.isAfterCutoff && (
                              <span className="text-[10px] no-underline font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 rounded ml-0.5">
                                Closed (Past 7 PM)
                              </span>
                            )}
                          </button>

                          {/* Tomorrow */}
                          <button
                            type="button"
                            onClick={() => setInstallationDate(deliveryCutoffInfo.tomorrow)}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5",
                              installationDate === deliveryCutoffInfo.tomorrow
                                ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "border-border bg-background hover:bg-muted/50 text-foreground"
                            )}
                          >
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Tomorrow</span>
                          </button>

                          {/* Day After */}
                          <button
                            type="button"
                            onClick={() => setInstallationDate(deliveryCutoffInfo.dayAfter)}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5",
                              installationDate === deliveryCutoffInfo.dayAfter
                                ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "border-border bg-background hover:bg-muted/50 text-foreground"
                            )}
                          >
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Day After</span>
                          </button>
                        </div>

                        {/* Direct Native Date Input */}
                        <div className="flex items-center gap-2">
                          <Input
                            id="install-date"
                            type="date"
                            className="bg-background max-w-[220px] text-xs sm:text-sm h-9"
                            min={deliveryCutoffInfo.minInstallationDate}
                            value={installationDate}
                            onChange={(e) => setInstallationDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Informational notice & cutoff warning */}
                      {deliveryCutoffInfo.isAfterCutoff ? (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Same-Day Slot Closed (7:00 PM Cutoff):</span>{" "}
                            Orders placed after 7:00 PM cannot be delivered/installed today. Earliest available slot starts from tomorrow ({deliveryCutoffInfo.tomorrow}).
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Same-day installation is available for orders placed before <strong>7:00 PM</strong> today.</span>
                        </div>
                      )}

                      {/* Error message if invalid past/today date is entered */}
                      {installationDate && installationDate < deliveryCutoffInfo.minInstallationDate && (
                        <p className="text-xs text-destructive font-medium">
                          {deliveryCutoffInfo.isAfterCutoff
                            ? "Same-day installation is closed after 7:00 PM. Please select tomorrow or a later date."
                            : "Selected installation date cannot be in the past. Please choose a valid date."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
            <div className="mt-5 sm:mt-6">
              <Button
                variant="brand"
                size="lg"
                className="w-full sm:w-auto min-w-[160px]"
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
            <div className="border rounded-xl overflow-hidden divide-y bg-background">
              {items.map((it) => {
                if (!it?.product) return null;
                const isItemRemoving = removeCartItem.isPending && removeCartItem.variables === it.cartItemId;
                const isItemUpdating = updateCartItemQty.isPending && updateCartItemQty.variables?.cartItemId === it.cartItemId;

                return (
                  <div
                    key={it.cartItemId}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 transition-all",
                      (isItemRemoving || isItemUpdating) && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Product Image */}
                      <div className="h-14 w-14 sm:h-16 sm:w-16 bg-muted rounded-lg border flex items-center justify-center shrink-0 overflow-hidden">
                        {it.product.productImage ? (
                          <img
                            src={it.product.productImage}
                            alt={it.product.productName || "Product"}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">No img</span>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm text-foreground leading-snug line-clamp-2">
                          {it.product.productName || "Product"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {it.exchangeOldBattery && (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              With Exchange
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ₹{(it.product.productPrice || 0).toLocaleString("en-IN")} each
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Controls & Price Row */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-border/50">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border rounded-lg bg-muted/30">
                        <button
                          type="button"
                          disabled={it.quantity <= 1 || isItemUpdating}
                          onClick={() => updateCartItemQty.mutate({ cartItemId: it.cartItemId, qty: it.quantity - 1 })}
                          className="h-7 w-7 flex items-center justify-center hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-foreground">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isItemUpdating}
                          onClick={() => updateCartItemQty.mutate({ cartItemId: it.cartItemId, qty: it.quantity + 1 })}
                          className="h-7 w-7 flex items-center justify-center hover:bg-muted text-foreground transition-colors cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Item Total Price */}
                      <div className="text-right min-w-[70px]">
                        <Price
                          value={(it.product.productPrice || 0) * it.quantity}
                          size="sm"
                          className="font-bold sm:text-base"
                        />
                      </div>

                      {/* Remove / Trash Button */}
                      <button
                        type="button"
                        onClick={() => removeCartItem.mutate(it.cartItemId)}
                        disabled={isItemRemoving}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                        title="Remove item from order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 sm:mt-6">
              <Button variant="brand" size="lg" className="w-full sm:w-auto min-w-[160px]" onClick={() => setActiveStep(5)}>
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
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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
              <p className="mt-3.5 sm:mt-4 rounded-md bg-primary/10 border border-primary/20 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-primary flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                Online payment will be initiated securely after order placement.
              </p>
            )}

            {isUnserviceable && (
              <div className="mt-5 sm:mt-6">
                <ServiceabilityWarningCTA
                  postalCode={selectedAddress?.postalCode}
                  cityName={selectedAddress?.city}
                  onChangeAddress={handleChangeAddress}
                  onViewCities={() => setIsLocationModalOpen(true)}
                />
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
              <div className="flex items-center justify-between sm:block">
                <span className="text-xs text-muted-foreground uppercase tracking-wider block">Total Payable</span>
                <Price value={totalAmount} size="lg" className="font-extrabold text-foreground" />
              </div>
              <Button
                variant="brand"
                size="lg"
                className="w-full sm:w-auto min-w-[200px] text-base sm:text-lg h-12 shadow-md shadow-brand/20"
                disabled={!canPlace}
                onClick={handlePlaceOrder}
              >
                {isProcessing ? <Spinner size="sm" className="mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                {isUnserviceable
                  ? "Delivery Unavailable"
                  : isCheckingServiceability
                    ? "Checking Serviceability..."
                    : paymentMethod === "ONLINE"
                      ? `Pay Now`
                      : "Place Order"}
              </Button>
            </div>
          </CheckoutStep>

        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <aside className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden lg:sticky lg:top-24">
          <div className="bg-muted/30 border-b p-4 sm:p-5 flex items-center justify-between">
            <h2 className="font-display text-base sm:text-lg font-semibold text-foreground uppercase tracking-wide">Price Details</h2>
            {effectiveCity && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {effectiveCity.cityName}
              </span>
            )}
          </div>
          <div className="p-4 sm:p-5">
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

              {campaignDiscountAmount > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                  <dt className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Offer Discount ({campaignDiscountSummary.campaignNames.join(", ")})</span>
                  </dt>
                  <dd>
                    -<Price value={campaignDiscountAmount} size="sm" />
                  </dd>
                </div>
              )}

              <div className="my-2 border-t border-dashed" />

              {!appliedCoupon ? (
                <div>
                  <div className="flex gap-2 mb-1.5">
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
                  {campaignDiscountSummary.hasDealItems && (
                    <p className="text-[10px] text-muted-foreground/80 mb-2">
                      *Note: Products with special campaign deals are excluded from additional coupon discounts.
                    </p>
                  )}
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
        className={`flex items-center justify-between p-3.5 sm:p-5 transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'} ${completed && !active ? 'cursor-pointer hover:bg-muted/30' : ''}`}
        onClick={() => { if (completed && !active && onEdit) onEdit(); }}
      >
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          <div className={`grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded text-xs sm:text-sm font-bold shrink-0 transition-colors ${active ? 'bg-background text-primary' : 'bg-muted-foreground/10 text-muted-foreground'} ${completed && !active ? 'bg-background text-primary border border-border shadow-xs' : ''}`}>
            {completed && !active ? <Check className="h-3.5 w-3.5 text-primary" /> : index}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold uppercase tracking-wide truncate">{title}</h2>
            {completed && !active && summary && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 sm:hidden">{summary}</p>
            )}
          </div>
          {completed && !active && summary && (
            <span className="hidden sm:inline-block ml-4 text-sm font-medium text-foreground truncate opacity-80 border-l pl-4 border-border">
              {summary}
            </span>
          )}
        </div>
        {completed && !active && onEdit && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-7 sm:h-8 text-xs ml-2 shrink-0">Change</Button>
        )}
      </div>

      {active && (
        <div className="p-3.5 sm:p-6 bg-card animate-in slide-in-from-top-2 fade-in duration-300">
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
      className={`rounded-xl border-2 p-4 text-left transition-colors flex items-start gap-4 ${active
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

