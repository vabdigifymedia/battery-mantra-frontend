import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Package, Truck, Wrench } from "lucide-react";
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
  const order = useQuery({
    ...orderDetailQuery(orderId),
    enabled: status === "authenticated",
  });

  const cancel = useMutation({
    mutationFn: () => ordersService.cancel(orderId),
    onSuccess: () => {
      toast.success("Order cancelled");
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
      case "SHIPPED": return 2;
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
      case "SHIPPED": return "Dispatched";
      case "DELIVERED": return "Delivered";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  };

  return (
    <div>
      <PageHeader
        title={`Order #${o.orderId.slice(0, 8)}`}
        description={`Placed ${formatDate(o.placedAt)}`}
      />
      <Container size="xl" className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{getStatusDisplayLabel(o.orderStatus)}</Badge>
            {canCancel ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancel.mutate()}
                disabled={cancel.isPending}
              >
                Cancel order
              </Button>
            ) : null}
          </div>

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

          <ul className="space-y-3">
            {o.orderItems.map((it) => (
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
                      to="/products/$id"
                      params={{ id: it.productId }}
                      className="line-clamp-2 text-sm font-semibold hover:text-primary"
                    >
                      {it.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Qty {it.quantity} × <Price value={it.priceAtPurchase} size="sm" />
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
                <dd>{o.orderItems.length}</dd>
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
    </div>
  );
}
