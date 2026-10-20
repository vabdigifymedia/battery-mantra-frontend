import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Clock,
  Package,
  Truck,
  Wrench,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  HelpCircle,
  PhoneCall,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Image } from "@/components/common/Image";
import { Price } from "@/components/common/Price";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Spinner } from "@/components/feedback/Spinner";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { useAuth } from "@/providers/AuthProvider";
import { orderDetailQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { ordersService } from "@/services/orders.service";
import { formatDate } from "@/lib/format/date";
import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";
import type { OrderResponse } from "@/types/dto";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order details — BatteryMantra" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { status } = useAuth();
  const qc = useQueryClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const order = useQuery({
    ...orderDetailQuery(orderId),
    enabled: status === "authenticated",
  });

  const cancel = useMutation({
    mutationFn: (reason?: string) => ordersService.cancel(orderId, reason),
    onSuccess: () => {
      toast.success("Order cancelled successfully");
      setIsCancelModalOpen(false);
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Cancel failed"),
  });

  if (status === "loading") return <FullPageLoader />;
  if (status !== "authenticated")
    return <Navigate to="/login" search={{ redirect: `/orders/${orderId}` }} />;

  if (order.isLoading)
    return (
      <div className="py-16 text-center">
        <Spinner />
      </div>
    );
  if (order.isError || !order.data)
    return (
      <Container size="lg" className="py-12">
        <ErrorState title="Couldn't load order" onRetry={() => void order.refetch()} />
      </Container>
    );

  const o = order.data;
  const canCancel = o.orderStatus === "PENDING";

  const getStatusIndex = (status: string) => {
    switch (status) {
      case "PENDING": return 0;
      case "PROCESSING": return 1;
      case "SHIPPED": 
      case "OUT_FOR_DELIVERY": return 2;
      case "DELIVERED": return 3;
      default: return -1;
    }
  };
  
  const statusIndex = getStatusIndex(o.orderStatus);
  const isCancelled = o.orderStatus === "CANCELLED";

  const getDeliveryLabel = (method?: string) => {
    if (method === "HOME_INSTALLATION") return "Home Installation";
    if (method === "STORE_PICKUP") return "Store Pickup";
    return "Standard Delivery";
  };

  const getStatusDisplayLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Order Placed";
      case "PROCESSING": return "Ready For Dispatch";
      case "SHIPPED": 
      case "OUT_FOR_DELIVERY": return "Dispatched";
      case "DELIVERED": return "Delivered";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  };

  return (
    <div>
      <PageHeader
        title={`Order #${o.orderId.slice(0, 8)}`}
        description={`Placed ${formatDate(o.placedAt || o.createdAt || "")}`}
      />
      <Container size="xl" className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{getStatusDisplayLabel(o.orderStatus)}</Badge>
              {isCancelled && (
                <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
                  Cancelled
                </span>
              )}
            </div>

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 ml-auto"
              >
                Cancel Order
              </Button>
            )}
          </div>

          {/* Cancellation Notice Banner */}
          {isCancelled && (
            <CancellationStatusNotice order={o} />
          )}

          {!isCancelled && statusIndex >= 0 && (
            <div className="py-6 mb-6">
              <h3 className="font-display text-sm font-semibold mb-4">Tracking Status</h3>
              <div className="relative flex justify-between">
                <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-border z-0">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-in-out" 
                    style={{ width: `${(Math.min(statusIndex, 3) / 3) * 100}%` }}
                  />
                </div>
                
                {[
                  { label: "Order Placed", icon: Clock },
                  { label: "Ready for Dispatch", icon: Package },
                  { label: "Dispatched", icon: Truck },
                  { label: "Delivered", icon: Check },
                ].map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = statusIndex >= idx;
                  const isCurrent = statusIndex === idx;
                  
                  return (
                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-semibold ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {["SHIPPED", "OUT_FOR_DELIVERY", "DISPATCHED"].includes(String(o.orderStatus)) && o.deliverySecurityCode && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Arriving Soon</p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/80">Please share the delivery code with our technician upon installation.</p>
                </div>
              </div>
              <div className="bg-white dark:bg-black/20 border border-blue-500/20 rounded-lg p-2 px-6 text-center shadow-sm w-full sm:w-auto">
                <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-0.5">Delivery Code</p>
                <p className="font-mono text-xl font-bold tracking-widest text-blue-700 dark:text-blue-400">{o.deliverySecurityCode}</p>
              </div>
            </div>
          )}

          <ul className="space-y-3">
            {(o.orderItems || o.items || []).map((it) => (
              <li
                key={it.productId}
                className="flex gap-4 rounded-xl border border-border bg-card p-3"
              >
                <Image
                  src={it.productImage}
                  alt={it.productName}
                  aspect="square"
                  className="h-20 w-20"
                />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/product/$"
                      params={{ _splat: (it as any).productSeoSlug || it.productId }}
                      className="line-clamp-2 text-sm font-semibold hover:text-primary"
                    >
                      {it.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Qty {it.quantity} × <Price value={it.priceAtPurchase || it.unitPrice || 0} size="sm" />
                    </p>
                  </div>
                  <Price value={it.subtotal} size="md" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit space-y-5 rounded-2xl border border-border bg-card p-5 shadow-product">
          <div>
            <h2 className="font-display text-lg font-semibold">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Items</dt>
                <dd>{(o.orderItems || o.items || []).length}</dd>
              </div>
              {(o.exchangeDiscount ?? 0) > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Scrap Discount</dt>
                  <dd>-<Price value={o.exchangeDiscount!} size="sm" /></dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery Method</dt>
                <dd className="font-medium text-right">{getDeliveryLabel(o.deliveryMethod)}</dd>
              </div>
              {o.deliveryMethod === "HOME_INSTALLATION" && o.installationDate && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Installation Date</dt>
                  <dd className="font-medium text-right text-primary">{formatDate(o.installationDate)}</dd>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base">
                <dt className="font-semibold">Total</dt>
                <dd>
                  <Price value={o.totalAmount} size="md" />
                </dd>
              </div>
            </dl>
          </div>
          {o.shippingAddress ? (
            <div>
              <h3 className="font-display text-sm font-semibold">Shipping to</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {o.shippingAddress}
              </p>
            </div>
          ) : null}
        </aside>
      </Container>

      {/* Interactive Multi-Step Cancellation Modal */}
      {canCancel && (
        <CustomerCancelOrderDialog
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirmCancel={(reason) => cancel.mutate(reason)}
          isCancelling={cancel.isPending}
          orderId={orderId}
        />
      )}
    </div>
  );
}

// Subcomponents

const CUSTOMER_CANCEL_REASONS = [
  "Found a lower price or local deal",
  "Selected incorrect battery brand or vehicle model",
  "Delivery or installation timing does not work for me",
  "Placed duplicate order by mistake",
  "Vehicle sold or no longer need replacement",
  "Other reason (please specify)",
];

function CustomerCancelOrderDialog({
  isOpen,
  onClose,
  onConfirmCancel,
  isCancelling,
  orderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string) => void;
  isCancelling: boolean;
  orderId: string;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customRemarks, setCustomRemarks] = useState<string>("");

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCancelling) {
      onClose();
      setTimeout(() => {
        setStep(1);
        setSelectedReason("");
        setCustomRemarks("");
      }, 200);
    }
  };

  const handleFinalSubmit = () => {
    const finalReason =
      selectedReason === "Other reason (please specify)"
        ? customRemarks.trim() || "Customer requested cancellation"
        : customRemarks.trim()
        ? `${selectedReason}: ${customRemarks.trim()}`
        : selectedReason || "Customer requested cancellation";
    onConfirmCancel(finalReason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-6">
        {step === 1 && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-lg font-bold">
                Are you sure you want to cancel?
              </DialogTitle>
              <DialogDescription className="text-center text-xs leading-relaxed">
                Order #{orderId.slice(0, 8)} is confirmed and scheduled for technician allocation.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Benefits you will miss with this order:</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-muted-foreground">
                <li>Free doorstep delivery & expert battery installation</li>
                <li>Instant scrap exchange discount applied directly</li>
                <li>100% Genuine manufacturer warranty guaranteed</li>
              </ul>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="brand"
                className="w-full sm:flex-1"
                onClick={onClose}
              >
                Keep My Order
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setStep(2)}
              >
                Continue Cancellation
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Why are you cancelling?
              </DialogTitle>
              <DialogDescription className="text-xs">
                Please select the primary reason to help us improve our fulfillment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {CUSTOMER_CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-xs cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? "border-primary bg-primary/5 font-semibold text-foreground"
                      : "border-border hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Tell us more about your decision..."
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                className="w-full rounded-xl border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="brand"
                size="sm"
                className="flex-1"
                disabled={!selectedReason}
                onClick={() => setStep(3)}
              >
                Proceed to Confirm
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <XCircle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-lg font-bold text-destructive">
                Confirm Cancellation
              </DialogTitle>
              <DialogDescription className="text-center text-xs">
                This action is immediate and cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20 p-3.5 text-xs space-y-1 text-rose-950 dark:text-rose-200">
              <span className="font-semibold block text-[11px] uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Reason to be recorded:
              </span>
              <p className="font-medium">
                {selectedReason}
                {customRemarks.trim() ? ` — "${customRemarks.trim()}"` : ""}
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isCancelling}
                onClick={() => setStep(2)}
              >
                Change Reason
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={isCancelling}
                onClick={handleFinalSubmit}
              >
                {isCancelling ? (
                  <>
                    <Spinner size="sm" className="mr-2" /> Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Order"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CancellationStatusNotice({ order }: { order: OrderResponse }) {
  const isCustomerCancelled = order.cancelledBy === "CUSTOMER";

  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <XCircle className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive uppercase tracking-wide">
              Order Cancelled
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {isCustomerCancelled ? "Cancelled by You" : "Battery Mantra Fulfillment Update"}
            </span>
          </div>

          <h3 className="text-base font-bold text-foreground">
            {isCustomerCancelled
              ? "This order was cancelled on your request"
              : "We were unable to fulfill this order"}
          </h3>

          <div className="rounded-xl bg-background/80 border p-3.5 text-sm">
            <span className="font-semibold text-foreground text-xs uppercase tracking-wider block mb-1">
              Cancellation Reason:
            </span>
            <p className="text-foreground/90 font-medium leading-relaxed">
              {order.cancellationReason || (isCustomerCancelled ? "Requested by customer" : "Operational / inventory constraint")}
            </p>
          </div>

          {!isCustomerCancelled && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                <span>Need assistance or want to re-order an alternative battery?</span>
              </div>
              <a
                href="tel:9871172442"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Call Support (+91 98711 72442)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

