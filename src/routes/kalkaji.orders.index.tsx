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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Truck,
  Wrench,
  Search,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Eye,
  AlertTriangle,
  Globe,
  XCircle,
} from "lucide-react";
import { partnerService } from "@/services/partner.service";
import { engineerService } from "@/services/engineer.service";
import type { OrderStatus, OrderResponse } from "@/types/dto";

export const Route = createFileRoute("/kalkaji/orders/")({
  component: AdminOrders,
});

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_NEW = ["PENDING", "CONFIRMED"];
const STATUS_READY = ["PROCESSING"];
const STATUS_DISPATCHED = ["SHIPPED", "OUT_FOR_DELIVERY"];
const STATUS_DELIVERED = ["DELIVERED", "INSTALLED"];
const STATUS_CANCELLED = ["CANCELLED"];

export const checkCityMismatch = (selectedCity?: string, shippingAddress?: string) => {
  if (!selectedCity || !shippingAddress) return false;
  const sel = selectedCity.trim().toLowerCase();
  const addr = shippingAddress.toLowerCase();
  
  if (addr.includes(sel)) return false;
  
  // Synonyms and variations
  if ((sel.includes("gurgaon") || sel.includes("gurugram")) && (addr.includes("gurgaon") || addr.includes("gurugram"))) return false;
  if ((sel.includes("delhi") || sel.includes("ncr")) && addr.includes("delhi")) return false;
  if ((sel.includes("bangalore") || sel.includes("bengaluru")) && (addr.includes("bangalore") || addr.includes("bengaluru"))) return false;
  
  return true;
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING":
    case "CONFIRMED": return "Order Placed";
    case "PROCESSING": return "Ready For Dispatch";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY": return "Dispatched";
    case "DELIVERED":
    case "INSTALLED": return "Delivered";
    case "CANCELLED": return "Cancelled";
    default: return status;
  }
};

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery(adminOrdersQuery());
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [cancelTargetOrder, setCancelTargetOrder] = useState<OrderResponse | null>(null);
  const [pendingEngineerSwitch, setPendingEngineerSwitch] = useState<{
    engineerId: string;
    engineerName: string;
  } | null>(null);
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
    mutationFn: ({
      orderId,
      status,
      cancellationReason,
    }: {
      orderId: string;
      status: OrderStatus;
      cancellationReason?: string;
    }) =>
      adminService.updateOrderStatus(orderId, { orderStatus: status, cancellationReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCancelTargetOrder(null);
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
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order reassigned successfully");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to assign partner"),
  });

  const assignEngineerMutation = useMutation({
    mutationFn: ({ orderId, engineerId }: { orderId: string; engineerId: string }) =>
      adminService.assignEngineer(orderId, engineerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order reassigned successfully");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to assign engineer"),
  });

  const unassignPartnerMutation = useMutation({
    mutationFn: (orderId: string) => adminService.unassignPartner(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Partner unassigned successfully");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to unassign partner"),
  });

  const unassignEngineerMutation = useMutation({
    mutationFn: (orderId: string) => adminService.unassignEngineer(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Engineer unassigned successfully");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to unassign engineer"),
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
      case "CANCELLED": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
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
                          {(order.orderItems?.length || 0)} item{(order.orderItems?.length || 0) === 1 ? '' : 's'} • ₹{order.totalAmount.toLocaleString()}
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
                          {order.selectedCity && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                🌐 {order.selectedCity}
                              </span>
                              {checkCityMismatch(order.selectedCity, order.shippingAddress) && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                  <AlertTriangle className="h-2.5 w-2.5" /> Mismatch
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{formatRelativeTime(order.placedAt)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.placedAt ? new Date(order.placedAt).toLocaleDateString() : "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {order.orderStatus === "CANCELLED" ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border bg-red-500/10 text-red-600 border-red-500/20">
                          <XCircle className="h-3 w-3 shrink-0" /> Cancelled
                        </span>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                          By: <strong className="text-foreground">{order.cancelledBy || "Unknown"}</strong>
                        </p>
                        {order.cancellationReason && (
                          <p className="text-[10px] text-muted-foreground italic truncate max-w-[150px]" title={order.cancellationReason}>
                            "{order.cancellationReason}"
                          </p>
                        )}
                      </div>
                    ) : order.assignedPartner ? (
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
                        onValueChange={(val) => {
                          if (val === "CANCELLED") {
                            setCancelTargetOrder(order);
                          } else {
                            updateStatusMutation.mutate({ orderId: order.orderId, status: val as OrderStatus });
                          }
                        }}
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
                  <p className="text-[10px] text-muted-foreground mt-0.5">{(order.orderItems?.length || 0)} item{(order.orderItems?.length || 0) === 1 ? '' : 's'}</p>
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
                    {order.selectedCity && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          🌐 {order.selectedCity}
                        </span>
                        {checkCityMismatch(order.selectedCity, order.shippingAddress) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="h-2.5 w-2.5" /> Mismatch
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                {order.orderStatus === "CANCELLED" ? (
                  <div className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-red-600">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      Order Cancelled
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Cancelled By: <strong className="text-foreground">{order.cancelledBy || "N/A"}</strong>
                    </div>
                    {order.cancellationReason && (
                      <div className="text-[11px] text-muted-foreground italic truncate mt-0.5" title={order.cancellationReason}>
                        "{order.cancellationReason}"
                      </div>
                    )}
                  </div>
                ) : (
                  <Select
                    defaultValue={order.orderStatus}
                    onValueChange={(val) => {
                      if (val === "CANCELLED") {
                        setCancelTargetOrder(order);
                      } else {
                        updateStatusMutation.mutate({ orderId: order.orderId, status: val as OrderStatus });
                      }
                    }}
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
                )}
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
          <Link to="/kalkaji/orders/create">
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
        <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setPendingEngineerSwitch(null); } }}>
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
              {selectedOrder.orderStatus === "CANCELLED" && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-600">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <span>Order Was Cancelled</span>
                    {selectedOrder.cancelledBy && (
                      <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                        By {selectedOrder.cancelledBy}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-foreground">
                    <span className="font-semibold text-muted-foreground">Reason Recorded: </span>
                    <span className="italic font-medium">
                      {selectedOrder.cancellationReason || "No specific reason was provided"}
                    </span>
                  </div>
                </div>
              )}
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
                    {/* Selected City vs Shipping Address Check */}
                    <div className="rounded-lg bg-muted/60 p-2.5 border text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                          Website Selected City:
                        </span>
                        <span className="font-semibold text-foreground px-2 py-0.5 rounded bg-background border shadow-2xs">
                          {selectedOrder.selectedCity || "Not recorded / Prior Order"}
                        </span>
                      </div>
                      {checkCityMismatch(selectedOrder.selectedCity, selectedOrder.shippingAddress) && (
                        <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs mt-1">
                          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div>
                            <span className="font-bold">City Mismatch Warning:</span> Customer selected <strong>"{selectedOrder.selectedCity}"</strong> on website, but the delivery address below appears to be for a different city. Please confirm with the customer before processing.
                          </div>
                        </div>
                      )}
                    </div>

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
                    {selectedOrder.assignedEngineer && (
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="leading-snug">
                          Assigning a Partner will reassign from Direct Engineer to Partner fulfillment.
                        </span>
                      </div>
                    )}
                    <Select
                      value={selectedOrder.assignedPartner?.id || "unassigned"}
                      onValueChange={(val) => {
                        if (val === "unassigned") {
                          if (selectedOrder.assignedPartner) {
                            unassignPartnerMutation.mutate(selectedOrder.orderId);
                            setSelectedOrder({ ...selectedOrder, assignedPartner: null });
                          }
                          return;
                        }
                        if (val !== selectedOrder.assignedPartner?.id) {
                          assignPartnerMutation.mutate({ orderId: selectedOrder.orderId, partnerId: val });
                          const p = partners.find((p) => p.id === val);
                          if (p) {
                            setSelectedOrder({ ...selectedOrder, assignedPartner: p as any, assignedEngineer: null });
                          }
                        }
                      }}
                      disabled={assignPartnerMutation.isPending || unassignPartnerMutation.isPending}
                    >
                      <SelectTrigger className="w-full text-xs font-medium">
                        <SelectValue placeholder="Select Partner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" className="text-muted-foreground italic">
                          -- Clear / Unassign Partner --
                        </SelectItem>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.businessName} ({p.operatingCities?.map((c) => c.cityName).join(", ") || ""})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Direct Engineer Assignment</h3>
                  <div className="rounded-xl border bg-card p-3.5 space-y-2">
                    <p className="text-xs text-muted-foreground">Assign a Direct Admin technician for installation/delivery.</p>
                    {selectedOrder.assignedPartner && (
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="leading-snug">
                          Reassigning to a Direct Engineer will remove the order from Partner fulfillment ({selectedOrder.assignedPartner.businessName}).
                        </span>
                      </div>
                    )}
                    <Select
                      value={selectedOrder.assignedEngineer?.id || "unassigned"}
                      onValueChange={(val) => {
                        if (val === "unassigned") {
                          if (selectedOrder.assignedEngineer) {
                            unassignEngineerMutation.mutate(selectedOrder.orderId);
                            setSelectedOrder({ ...selectedOrder, assignedEngineer: null });
                          }
                          return;
                        }
                        const eng = adminEngineers.find((e) => e.id === val);
                        const engName = eng ? (eng.firstName && eng.lastName ? `${eng.firstName} ${eng.lastName}` : (eng.fullName || "Engineer")) : "Engineer";
                        if (selectedOrder.assignedPartner) {
                          setPendingEngineerSwitch({ engineerId: val, engineerName: engName });
                        } else {
                          assignEngineerMutation.mutate({ orderId: selectedOrder.orderId, engineerId: val });
                          if (eng) setSelectedOrder({ ...selectedOrder, assignedEngineer: eng as any });
                        }
                      }}
                      disabled={assignEngineerMutation.isPending || unassignEngineerMutation.isPending}
                    >
                      <SelectTrigger className="w-full text-xs font-medium">
                        <SelectValue placeholder="Select Direct Engineer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" className="text-muted-foreground italic">
                          -- Clear / Unassign Engineer --
                        </SelectItem>
                        {adminEngineers.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground">No Direct Admin engineers found</div>
                        ) : (
                          adminEngineers.map((eng) => {
                            const name = eng.firstName && eng.lastName ? `${eng.firstName} ${eng.lastName}` : (eng.fullName || "Engineer");
                            return (
                              <SelectItem key={eng.id} value={eng.id}>
                                {name} ({eng.city || "Admin Staff"})
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order Items</h3>
                <div className="rounded-xl border bg-card divide-y">
                  {(selectedOrder.orderItems || []).map((item, idx) => (
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
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} × ₹{(item.priceAtPurchase ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="font-semibold text-sm">
                        ₹{(item.subtotal ?? ((item.priceAtPurchase ?? 0) * item.quantity)).toLocaleString()}
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

      {pendingEngineerSwitch && selectedOrder && (
        <Dialog open={!!pendingEngineerSwitch} onOpenChange={(open) => !open && setPendingEngineerSwitch(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-lg font-bold">
                Switch to Direct Engineer Fulfillment?
              </DialogTitle>
              <DialogDescription className="text-center text-xs">
                Reassigning to a Direct Engineer will remove the order from Partner fulfillment{selectedOrder.assignedPartner?.businessName ? ` (${selectedOrder.assignedPartner.businessName})` : ""}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 text-xs text-muted-foreground text-center">
              Assigning <strong className="text-foreground">{pendingEngineerSwitch.engineerName}</strong> as the Direct Technician for Order #{selectedOrder.orderId?.slice(0, 8)}.
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={assignEngineerMutation.isPending}
                onClick={() => setPendingEngineerSwitch(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={assignEngineerMutation.isPending}
                onClick={() => {
                  const val = pendingEngineerSwitch.engineerId;
                  const eng = adminEngineers.find((e) => e.id === val);
                  assignEngineerMutation.mutate({ orderId: selectedOrder.orderId, engineerId: val });
                  setSelectedOrder({ ...selectedOrder, assignedEngineer: eng as any, assignedPartner: null });
                  setPendingEngineerSwitch(null);
                }}
              >
                {assignEngineerMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" /> Assigning...
                  </>
                ) : (
                  "Confirm Switch"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {cancelTargetOrder && (
        <AdminCancelOrderDialog
          order={cancelTargetOrder}
          isOpen={!!cancelTargetOrder}
          onClose={() => setCancelTargetOrder(null)}
          isCancelling={updateStatusMutation.isPending}
          onConfirm={(reason) =>
            updateStatusMutation.mutate({
              orderId: cancelTargetOrder.orderId,
              status: "CANCELLED",
              cancellationReason: reason,
            })
          }
        />
      )}
    </div>
  );
}

const ADMIN_CANCELLATION_REASONS = [
  "Out of stock / Battery model unavailable",
  "Delivery address unserviceable / Outside delivery area",
  "Customer requested cancellation via phone/support",
  "Customer unreachable / Unverified phone number",
  "Suspected fraudulent / Duplicate order",
  "Pricing or vehicle-battery mismatch",
  "Other operational reason",
];

function AdminCancelOrderDialog({
  order,
  isOpen,
  onClose,
  isCancelling,
  onConfirm,
}: {
  order: OrderResponse;
  isOpen: boolean;
  onClose: () => void;
  isCancelling: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [selectedReason, setSelectedReason] = useState(ADMIN_CANCELLATION_REASONS[0]);
  const [customRemarks, setCustomRemarks] = useState("");

  const handleConfirm = () => {
    const finalReason = customRemarks.trim()
      ? `${selectedReason} - ${customRemarks.trim()}`
      : selectedReason;
    onConfirm(finalReason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isCancelling && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <XCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            Cancel Order #{order.orderId?.slice(0, 8)}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Select an operational reason. This will be recorded under fulfillment audit and sent to the customer via SMS/notification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Operational Reason
            </label>
            <div className="space-y-2">
              {ADMIN_CANCELLATION_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground shadow-2xs"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span>{reason}</span>
                    <span
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Internal Remarks / Notes (Optional)
            </label>
            <Input
              value={customRemarks}
              onChange={(e) => setCustomRemarks(e.target.value)}
              placeholder="e.g., Customer confirmed on 9876543210 they got it locally"
              className="text-xs"
              disabled={isCancelling}
            />
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-800 dark:text-amber-300">
            <strong>Stock Auto-Restore:</strong> The inventory reserved for this order will be automatically restored upon cancellation.
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isCancelling}
            onClick={onClose}
          >
            Keep Order Active
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={isCancelling}
            onClick={handleConfirm}
          >
            {isCancelling ? (
              <>
                <Spinner size="sm" className="mr-2" /> Cancelling...
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
