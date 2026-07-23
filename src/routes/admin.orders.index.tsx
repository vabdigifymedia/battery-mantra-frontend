import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { adminOrdersQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Truck, Wrench, Search, MapPin, Calendar, User, Phone, Mail, Eye } from "lucide-react";
import { partnerService } from "@/services/partner.service";
import { engineerService } from "@/services/engineer.service";
import type { OrderStatus, OrderResponse } from "@/types/dto";

export const Route = createFileRoute("/admin/orders/")({
  component: AdminOrders,
});

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_NEW = ["PENDING", "CONFIRMED"];
const STATUS_READY = ["PROCESSING"];
const STATUS_DISPATCHED = ["SHIPPED", "OUT_FOR_DELIVERY"];
const STATUS_DELIVERED = ["DELIVERED", "INSTALLED"];
const STATUS_CANCELLED = ["CANCELLED", "RETURNED"];

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING":
    case "CONFIRMED": return "Order Placed";
    case "PROCESSING": return "Ready For Dispatch";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY": return "Dispatched";
    case "DELIVERED":
    case "INSTALLED": return "Delivered";
    case "CANCELLED":
    case "RETURNED": return "Cancelled";
    default: return status;
  }
};

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery(adminOrdersQuery());
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const prevOrdersCountRef = useRef(orders.length);

  useEffect(() => {
    if (orders.length > prevOrdersCountRef.current && prevOrdersCountRef.current !== 0) {
      toast.success("🚨 New Order Received!", {
        description: "A new order has been placed by a customer.",
        duration: 8000,
      });
    }
    prevOrdersCountRef.current = orders.length;
  }, [orders.length]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      adminService.updateOrderStatus(orderId, { orderStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: partnerService.getAll,
  });

  const { data: allEngineers = [] } = useQuery({
    queryKey: ["admin", "engineers"],
    queryFn: engineerService.getAll,
  });

  // Filter only Direct Admin Engineers for Admin assignment
  const adminEngineers = allEngineers.filter((e) => !e.partnerId && e.isActive);

  const assignPartnerMutation = useMutation({
    mutationFn: ({ orderId, partnerId }: { orderId: string; partnerId: string }) =>
      adminService.assignPartner(orderId, partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Partner assigned successfully");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to assign partner"),
  });

  const assignEngineerMutation = useMutation({
    mutationFn: ({ orderId, engineerId }: { orderId: string; engineerId: string }) =>
      adminService.assignEngineer(orderId, engineerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Engineer assigned successfully");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to assign engineer"),
  });

  const filteredOrders = orders.filter((o) =>
    o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
    (o.shippingAddress && o.shippingAddress.toLowerCase().includes(search.toLowerCase())) ||
    (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  const getOrdersForTab = (tab: string) => {
    switch (tab) {
      case "new": return filteredOrders.filter((o) => STATUS_NEW.includes(o.orderStatus));
      case "ready": return filteredOrders.filter((o) => STATUS_READY.includes(o.orderStatus));
      case "dispatched": return filteredOrders.filter((o) => STATUS_DISPATCHED.includes(o.orderStatus));
      case "delivered": return filteredOrders.filter((o) => STATUS_DELIVERED.includes(o.orderStatus));
      case "cancelled": return filteredOrders.filter((o) => STATUS_CANCELLED.includes(o.orderStatus));
      case "admin_direct": return filteredOrders.filter((o) => !o.assignedPartner);
      case "partner_assigned": return filteredOrders.filter((o) => !!o.assignedPartner);
      default: return filteredOrders;
    }
  };

  const pendingCount = filteredOrders.filter((o) => STATUS_NEW.includes(o.orderStatus)).length;
  const adminDirectCount = filteredOrders.filter((o) => !o.assignedPartner).length;
  const partnerAssignedCount = filteredOrders.filter((o) => !!o.assignedPartner).length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Order ID copied");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "PROCESSING": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "SHIPPED": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "DELIVERED": return "bg-green-500/10 text-green-600 border-green-500/20";
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
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[250px]">Order Details</TableHead>
              <TableHead className="w-[200px]">Customer</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="w-[180px]">Status Update</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Spinner
                    size="md" className="inline-block" />
                </TableCell>
              </TableRow>
            ) : !data.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
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
                          <span className="font-mono text-xs font-semibold">#{order.orderId?.slice(0, 8)}</span>
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
                    <div className="flex flex-col gap-1.5 text-sm">
                      {order.customerName && (
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[150px]">{order.customerName}</span>
                        </div>
                      )}
                      {order.customerPhone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{order.customerPhone}</span>
                        </div>
                      )}
                      {order.customerEmail && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[150px]" title={order.customerEmail}>{order.customerEmail}</span>
                        </div>
                      )}
                      {!order.customerName && !order.customerPhone && !order.customerEmail && (
                        <span className="text-muted-foreground text-xs italic">No details available</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.paymentMethod === "ONLINE" ? (
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">ONLINE</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">COD</span>
                    )}
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
                        <div className="flex flex-col gap-1 mt-0.5">
                          {order.deliveryMethod === "HOME_INSTALLATION" && order.installationDate && (
                            <div className="flex items-center text-xs text-primary font-medium truncate">
                              <Calendar className="h-3 w-3 mr-1 shrink-0" />
                              <span>{new Date(order.installationDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground truncate max-w-[200px]">
                            <MapPin className="h-3 w-3 mr-1 shrink-0" />
                            <span className="truncate">{order.shippingAddress?.split(',').pop()?.trim() || "No Address"}</span>
                          </div>
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
                    {order.assignedPartner ? (
                      <div className="space-y-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}>
                          {getStatusLabel(order.orderStatus)}
                        </span>
                        <p className="text-[10px] font-medium text-amber-600 truncate max-w-[150px]">
                          Partner: {order.assignedPartner.businessName}
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={order.orderStatus}
                        onValueChange={(val) =>
                          updateStatusMutation.mutate({ orderId: order.orderId, status: val as OrderStatus })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className={`h-8 text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}>
                          <SelectValue>{getStatusLabel(order.orderStatus)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs font-medium">
                              {getStatusLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => setSelectedOrder(order)} aria-label="View Order Details">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" className="mr-2" />
          </div>
        ) : !data.length ? (
          <div className="text-center py-12 text-muted-foreground font-medium">
            No orders found.
          </div>
        ) : (
          data.map((order) => (
            <div key={order.orderId} className="rounded-xl border border-border bg-card shadow-sm p-4 relative overflow-hidden">
              {order.orderStatus === "PENDING" && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-bold text-foreground">#{order.orderId?.slice(0, 8)}</span>
                    <button onClick={() => copyToClipboard(order.orderId)} className="text-muted-foreground p-1 active:scale-95">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(order.placedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">₹{order.totalAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{order.customerName || "No Name"}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.customerPhone || order.customerEmail || ""}</p>
                  </div>
                  {order.paymentMethod === "ONLINE" ? (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 shrink-0">ONLINE</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 shrink-0">COD</span>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1">
                  {order.deliveryMethod === "HOME_INSTALLATION" ? (
                    <Wrench className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm">
                      {order.deliveryMethod === "HOME_INSTALLATION" ? "Home Installation" :
                        order.deliveryMethod === "STORE_PICKUP" ? "Store Pickup" : "Standard Delivery"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.shippingAddress?.split(',').pop()?.trim() || "No Address"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <Select
                  defaultValue={order.orderStatus}
                  onValueChange={(val) =>
                    updateStatusMutation.mutate({ orderId: order.orderId, status: val as OrderStatus })
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className={`flex-1 h-9 text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}>
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
                <Button variant="outline" className="h-9 w-9 p-0 shrink-0 border-border" onClick={() => setSelectedOrder(order)}>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Order Management</h2>
          <p className="text-muted-foreground mt-1">Review, process and update customer orders.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link to="/admin/orders/create">
            <Button variant="default" className="shrink-0 font-semibold shadow-sm">
              + Create Order
            </Button>
          </Link>
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="mb-6 inline-flex min-w-max h-auto p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="all" className="py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              All Orders ({filteredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="admin_direct" className="py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Main Branch (Admin Direct) ({adminDirectCount})
            </TabsTrigger>
            <TabsTrigger value="partner_assigned" className="py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Partner Assigned ({partnerAssignedCount})
            </TabsTrigger>
            <TabsTrigger value="new" className="py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              New Orders
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Ready For Dispatch
            </TabsTrigger>
            <TabsTrigger value="dispatched" className="py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Dispatched
            </TabsTrigger>
            <TabsTrigger value="delivered" className="py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Delivered
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="py-2.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Cancelled
            </TabsTrigger>
          </TabsList>
        </div>

        <OrderTable data={getOrdersForTab(activeTab)} />
      </Tabs>

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center justify-between pr-8">
                <span>Order #{selectedOrder.orderId?.slice(0, 8)}</span>
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusColor(selectedOrder.orderStatus)}`}>
                  {selectedOrder.orderStatus.replace(/_/g, ' ')}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Customer Details</h3>
                  <div className="rounded-xl border bg-card p-4 space-y-3 text-sm h-full">
                    {selectedOrder.customerName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{selectedOrder.customerName}</span>
                      </div>
                    )}
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{selectedOrder.customerPhone}</span>
                      </div>
                    )}
                    {selectedOrder.customerEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{selectedOrder.customerEmail}</span>
                      </div>
                    )}
                    {!selectedOrder.customerName && !selectedOrder.customerPhone && !selectedOrder.customerEmail && (
                      <span className="text-muted-foreground italic">No details available</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Fulfillment</h3>
                  <div className="rounded-xl border bg-card p-4 space-y-3 text-sm h-full">
                    <div className="flex items-center gap-2 font-medium">
                      {selectedOrder.deliveryMethod === "HOME_INSTALLATION" ? <Wrench className="h-4 w-4 text-primary shrink-0" /> : <Truck className="h-4 w-4 text-blue-500 shrink-0" />}
                      {selectedOrder.deliveryMethod === "HOME_INSTALLATION" ? "Home Installation" : selectedOrder.deliveryMethod === "STORE_PICKUP" ? "Store Pickup" : "Standard Delivery"}
                    </div>
                    {selectedOrder.installationDate && (
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {new Date(selectedOrder.installationDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{selectedOrder.shippingAddress || "No Address Provided"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Partner Assignment</h3>
                  <div className="rounded-xl border bg-card p-3.5 space-y-2">
                    <p className="text-xs text-muted-foreground">Assign or reassign to local partner store for fulfillment.</p>
                    <Select
                      value={selectedOrder.assignedPartner?.id || ""}
                      onValueChange={(val) => {
                        assignPartnerMutation.mutate({ orderId: selectedOrder.orderId, partnerId: val });
                        const p = partners.find(p => p.id === val);
                        if (p) setSelectedOrder({ ...selectedOrder, assignedPartner: p as any });
                      }}
                      disabled={assignPartnerMutation.isPending}
                    >
                      <SelectTrigger className="w-full text-xs font-medium">
                        <SelectValue placeholder="Select Partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.businessName} ({p.operatingCities.map(c => c.cityName).join(", ")})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Direct Engineer Assignment</h3>
                  {selectedOrder.assignedPartner ? (
                    <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 p-3.5 space-y-1">
                      <p className="text-xs font-semibold text-amber-700">Handed over to Partner</p>
                      <p className="text-[11px] text-amber-600 leading-relaxed">
                        Order is assigned to <strong>{selectedOrder.assignedPartner.businessName}</strong>. Engineer assignment & fulfillment are managed by the partner branch.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-card p-3.5 space-y-2">
                      <p className="text-xs text-muted-foreground">Assign a Direct Admin technician for installation/delivery.</p>
                      <Select
                        value={selectedOrder.assignedEngineer?.id || ""}
                        onValueChange={(val) => {
                          assignEngineerMutation.mutate({ orderId: selectedOrder.orderId, engineerId: val });
                          const eng = adminEngineers.find(e => e.id === val);
                          if (eng) setSelectedOrder({ ...selectedOrder, assignedEngineer: eng as any });
                        }}
                        disabled={assignEngineerMutation.isPending}
                      >
                        <SelectTrigger className="w-full text-xs font-medium">
                          <SelectValue placeholder="Select Direct Engineer" />
                        </SelectTrigger>
                        <SelectContent>
                          {adminEngineers.length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground">No Direct Admin engineers found</div>
                          ) : (
                            adminEngineers.map(eng => {
                              const name = eng.firstName && eng.lastName ? `${eng.firstName} ${eng.lastName}` : (eng.fullName || "Engineer");
                              return (
                                <SelectItem key={eng.id} value={eng.id}>{name} ({eng.city || "Admin Staff"})</SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order Items</h3>
                <div className="rounded-xl border bg-card divide-y">
                  {selectedOrder.orderItems.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center gap-4">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="h-12 w-12 rounded object-cover border" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted border flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} × ₹{item.priceAtPurchase.toLocaleString()}</p>
                      </div>
                      <div className="font-semibold text-sm">
                        ₹{item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-muted/30">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{(selectedOrder.totalAmount + (selectedOrder.exchangeDiscount || 0)).toLocaleString()}</span>
                    </div>
                    {selectedOrder.exchangeDiscount && selectedOrder.exchangeDiscount > 0 ? (
                      <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                        <span>Exchange Discount</span>
                        <span>- ₹{selectedOrder.exchangeDiscount.toLocaleString()}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between items-center font-bold text-lg pt-2 border-t mt-2">
                      <span>Total</span>
                      <span>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
