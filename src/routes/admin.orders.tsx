import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminOrdersQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { Copy, Truck, Wrench, Search, MapPin } from "lucide-react";
import type { OrderStatus, OrderResponse } from "@/types/dto";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "INSTALLED", "CANCELLED", "RETURNED"];

const ACTION_REQUIRED_STATUSES = ["PENDING", "PROCESSING", "CONFIRMED"];
const IN_TRANSIT_STATUSES = ["SHIPPED", "OUT_FOR_DELIVERY"];
const PAST_STATUSES = ["DELIVERED", "INSTALLED", "CANCELLED", "RETURNED"];

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery(adminOrdersQuery());
  const [search, setSearch] = useState("");

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      adminService.updateOrderStatus(orderId, { orderStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const filteredOrders = orders.filter((o) =>
    o.orderId.toLowerCase().includes(search.toLowerCase()) ||
    (o.shippingAddress && o.shippingAddress.toLowerCase().includes(search.toLowerCase()))
  );

  const actionRequiredOrders = filteredOrders.filter((o) => ACTION_REQUIRED_STATUSES.includes(o.orderStatus));
  const inTransitOrders = filteredOrders.filter((o) => IN_TRANSIT_STATUSES.includes(o.orderStatus));
  const pastOrders = filteredOrders.filter((o) => PAST_STATUSES.includes(o.orderStatus));

  const pendingCount = actionRequiredOrders.filter(o => o.orderStatus === "PENDING").length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Order ID copied");
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "PROCESSING":
      case "CONFIRMED": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "SHIPPED":
      case "OUT_FOR_DELIVERY": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "DELIVERED":
      case "INSTALLED": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "CANCELLED":
      case "RETURNED": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);

    if (diffHrs < 24 && date.getDate() === now.getDate()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1 || (diffHrs < 48 && date.getDate() === now.getDate() - 1)) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const OrderTable = ({ data }: { data: OrderResponse[] }) => (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[250px]">Order Details</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead className="w-[180px]">Status Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center">
                <Spinner size="md" className="inline-block" />
              </TableCell>
            </TableRow>
          ) : !data.length ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">
                No orders found in this category.
              </TableCell>
            </TableRow>
          ) : (
            data.map((order) => (
              <TableRow key={order.orderId} className="group relative">
                <TableCell>
                  <div className="flex items-start gap-2">
                    {order.orderStatus === "PENDING" && (
                      <span className="mt-1.5 flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold">#{order.orderId.slice(0, 8)}</span>
                        <button onClick={() => copyToClipboard(order.orderId)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''} • ₹{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2 text-sm">
                    {order.deliveryMethod === "HOME_INSTALLATION" ? (
                      <Wrench className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    ) : (
                      <Truck className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">
                        {order.deliveryMethod === "HOME_INSTALLATION" ? "Home Installation" : 
                         order.deliveryMethod === "STORE_PICKUP" ? "Store Pickup" : "Standard Delivery"}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                        <MapPin className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{order.shippingAddress?.split(',').pop()?.trim() || "No Address"}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{formatRelativeTime(order.placedAt)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.placedAt).toLocaleDateString()}
                  </p>
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={order.orderStatus}
                    onValueChange={(val) => 
                      updateStatusMutation.mutate({ orderId: order.orderId, status: val as OrderStatus })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger className={`h-8 text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs font-medium">
                          {s.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Order Management</h2>
          <p className="text-muted-foreground mt-1">Review, process and update customer orders.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Order ID or City..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      <Tabs defaultValue="action" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 max-w-lg h-auto p-1 bg-muted/60">
          <TabsTrigger value="action" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Action Required
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transit" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            In Transit
            {inTransitOrders.length > 0 && (
              <span className="ml-2 text-xs font-medium text-muted-foreground">({inTransitOrders.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Past Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="action" className="mt-0 outline-none">
          <OrderTable data={actionRequiredOrders} />
        </TabsContent>
        
        <TabsContent value="transit" className="mt-0 outline-none">
          <OrderTable data={inTransitOrders} />
        </TabsContent>
        
        <TabsContent value="past" className="mt-0 outline-none">
          <OrderTable data={pastOrders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
