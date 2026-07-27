import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package, Car, Heart, MapPin, ChevronRight, Truck, Clock } from "lucide-react";
import { format } from "date-fns";

import { ordersService } from "@/services/orders.service";
import { wishlistService } from "@/services/wishlist.service";
import { userVehiclesService } from "@/services/userVehicles.service";
import { addressesQuery } from "@/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";

export function OverviewTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["userOrders"],
    queryFn: ({ signal }) => ordersService.list(signal),
  });

  const { data: wishlist } = useQuery({
    queryKey: ["userWishlist"],
    queryFn: ({ signal }) => wishlistService.list(signal),
  });

  const { data: vehicles } = useQuery({
    queryKey: ["userVehicles"],
    queryFn: ({ signal }) => userVehiclesService.list(signal),
  });

  const { data: addresses } = useQuery(addressesQuery(true));

  const activeOrders = orders?.filter((o) => ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "PLACED", "DISPATCHED"].includes(String(o.orderStatus))) || [];
  const recentOrder = orders?.[0];
  const defaultAddress = addresses?.find((a) => a.isDefault) || addresses?.[0];

  const isDummyName = !user?.username || user.username === user.phoneNumber || /^\d+$/.test(user.username);
  const greetingName = !isDummyName ? user!.username : "there";

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div>
        <h3 className="text-xl font-medium">Hello, {greetingName}!</h3>
        <p className="text-sm text-muted-foreground">Welcome to your dashboard. Here's a quick overview of your account.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("orders")}>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{orders?.length || 0}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Orders</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("wishlist")}>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
              <Heart className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{wishlist?.length || 0}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Saved Items</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("garage")}>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <Car className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{vehicles?.length || 0}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">My Garage</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setActiveTab("addresses")}>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{addresses?.length || 0}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Addresses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Order Snippet */}
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Recent Order
              </CardTitle>
              {recentOrder && (
                <Button variant="link" size="sm" onClick={() => setActiveTab("orders")} className="h-auto p-0">
                  View all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col justify-center">
            {recentOrder ? (
              <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Order #{recentOrder.orderId.substring(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(recentOrder.createdAt || recentOrder.placedAt || Date.now()), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="bg-muted text-muted-foreground text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded">
                    {recentOrder.orderStatus}
                  </span>
                </div>
                {["SHIPPED", "OUT_FOR_DELIVERY", "DISPATCHED"].includes(String(recentOrder.orderStatus)) && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Out for delivery</p>
                      <p className="text-xs text-blue-700/80 dark:text-blue-300/80">Code: <span className="font-mono font-bold">{(recentOrder as any).deliverySecurityCode || "N/A"}</span></p>
                    </div>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link to="/orders/$orderId" params={{ orderId: recentOrder.orderId }}>View Details</Link>
                </Button>
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <Package className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Default Address Snippet */}
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" /> Primary Address
              </CardTitle>
              <Button variant="link" size="sm" onClick={() => setActiveTab("addresses")} className="h-auto p-0">
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col justify-center">
            {defaultAddress ? (
              <div className="p-6 flex flex-col gap-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground text-base mb-1">{defaultAddress.fullName}</p>
                <p>{defaultAddress.addressLine1}</p>
                {defaultAddress.addressLine2 && <p>{defaultAddress.addressLine2}</p>}
                <p>{defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}</p>
                <p className="mt-2 text-foreground/80 font-medium">{defaultAddress.phoneNumber}</p>
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <MapPin className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No addresses saved yet</p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("addresses")}>Add Address</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
