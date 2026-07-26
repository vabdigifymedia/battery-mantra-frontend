import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Package, Truck, CheckCircle2, XCircle, ChevronRight, MapPin, ShieldCheck, Phone } from "lucide-react";

import { ordersService } from "@/services/orders.service";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { Price } from "@/components/common/Price";
import { cn } from "@/lib/utils";
import type { OrderResponse } from "@/types/dto";

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: any; className: string }> = {
    PLACED: { label: "Order Placed", icon: Package, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    DISPATCHED: { label: "Dispatched", icon: Truck, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    DELIVERED: { label: "Delivered", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    CANCELLED: { label: "Cancelled", icon: XCircle, className: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  };
  const config = map[status] || { label: status, icon: Package, className: "bg-muted text-muted-foreground" };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("px-2.5 py-1 text-xs font-medium gap-1.5 border", config.className)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
}

export function OrdersTab() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["userOrders"],
    queryFn: ({ signal }) => ordersService.list(signal),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No orders yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            When you place orders for batteries, they will appear here with live tracking.
          </p>
          <Button asChild variant="brand">
            <Link to="/products">Browse Batteries</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div>
        <h3 className="text-lg font-medium">Order History</h3>
        <p className="text-sm text-muted-foreground">Track and manage your recent battery orders.</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.orderId} className="overflow-hidden hover:border-primary/20 transition-colors">
            <CardHeader className="bg-muted/30 border-b pb-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <CardTitle className="text-base font-semibold">Order #{order.orderId.substring(0, 8).toUpperCase()}</CardTitle>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Placed on {format(new Date(order.createdAt || order.placedAt || Date.now()), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <Price value={order.totalAmount} className="font-bold text-lg" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Delivery Agent & OTP (If dispatched) */}
              {order.orderStatus === "DISPATCHED" && (
                <div className="bg-blue-500/5 border-b border-blue-500/10 p-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Arriving Soon</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-blue-700/80 dark:text-blue-300/80">
                        {order.deliveryAgentName && (
                          <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5"/> {order.deliveryAgentName}</span>
                        )}
                        {order.deliveryAgentPhone && (
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> {order.deliveryAgentPhone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {order.deliverySecurityCode && (
                    <div className="bg-white dark:bg-black/20 border border-blue-500/20 rounded-lg p-2 px-4 text-center shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-0.5 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Delivery Code
                      </p>
                      <p className="font-mono text-lg font-bold tracking-widest text-blue-700 dark:text-blue-400">
                        {order.deliverySecurityCode}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="p-6">
                <div className="flex flex-col gap-4">
                  {(order.items || order.orderItems || []).map((item: any) => (
                    <div key={item.orderItemId || item.productId} className="flex gap-4 items-start">
                      <div className="w-16 h-16 rounded-lg border bg-card flex-shrink-0 flex items-center justify-center p-2 overflow-hidden">
                        <img 
                          src={item.productImage || "https://placehold.co/400x400/png?text=Battery"} 
                          alt={item.productName} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base truncate">{item.productName}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Qty: {item.quantity} × ₹{(item.unitPrice || item.priceAtPurchase || 0).toLocaleString()}
                          {item.exchangeOldBattery && (
                            <span className="ml-2 text-success font-medium text-xs bg-success/10 px-1.5 py-0.5 rounded">
                              Old Battery Exchanged
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t p-4 px-6 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[200px] sm:max-w-xs">
                  {typeof order.shippingAddress === "object"
                    ? `${order.shippingAddress?.city || ""}, ${order.shippingAddress?.postalCode || ""}`
                    : order.shippingAddress || "Delivery Address"}
                </span>
              </div>
              <Button variant="outline" size="sm" asChild className="group">
                <Link to="/orders/$orderId" params={{ orderId: order.orderId }}>
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
