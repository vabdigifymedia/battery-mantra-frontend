import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, MapPin, Phone, Mail, Calendar, Package2, User, Filter } from "lucide-react";
import type { OrderStatus, OrderResponse } from "@/types/dto";

import { getStatusLabel } from "./admin.orders.index";

export const Route = createFileRoute("/partner/orders")({
  component: PartnerOrdersPage,
});

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function PartnerOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["partner", "orders"],
    queryFn: ({ signal }) => partnerDashboardService.listAssignedOrders(signal),
  });

  const { data: branchEngineers = [] } = useQuery({
    queryKey: ["partner", "engineers"],
    queryFn: ({ signal }) => partnerDashboardService.listEngineers(signal),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      partnerDashboardService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "orders"] });
      toast.success("Order status updated");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update order status"),
  });

  const assignEngineerMutation = useMutation({
    mutationFn: ({ orderId, engineerId }: { orderId: string; engineerId: string }) =>
      partnerDashboardService.assignEngineer(orderId, engineerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "orders"] });
      toast.success("Branch Engineer assigned to order");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to assign engineer"),
  });

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      (o.shippingAddress && o.shippingAddress.toLowerCase().includes(search.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || o.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assigned Orders</h1>
          <p className="text-muted-foreground">Manage and update installation status of orders assigned to your branch.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search by ID, Customer, Address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md bg-muted/50 w-full sm:w-[300px]"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:inline-block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full sm:w-[150px] bg-muted/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {getStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Showing <span className="font-semibold text-foreground">{filteredOrders.length}</span> of {orders.length} orders
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package2 className="h-8 w-8 text-muted-foreground/50" />
                    <p>No assigned orders found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.orderId} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[120px]" title={order.orderId}>
                        {order.orderId?.split("-")[0]}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(order.orderId)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(order.placedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.shippingAddress?.substring(0, 30)}...</div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.orderStatus}
                      onValueChange={(val) =>
                        updateStatusMutation.mutate({ orderId: order.orderId, status: val as OrderStatus })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className={`h-8 w-[150px] border ${getStatusColor(order.orderStatus)}`}>
                        <SelectValue>{getStatusLabel(order.orderStatus)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {getStatusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{order.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Order Details
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs border ${getStatusColor(selectedOrder.orderStatus)}`}>
                  {selectedOrder.orderStatus}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package2 className="h-4 w-4" /> Order ID
                  </p>
                  <p className="font-mono text-sm">{selectedOrder.orderId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date Placed
                  </p>
                  <p className="text-sm">{new Date(selectedOrder.placedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg border p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" /> Customer Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{selectedOrder.customerName}</p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" /> {selectedOrder.customerEmail}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {selectedOrder.customerPhone}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Delivery Address
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedOrder.shippingAddress}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Assign Branch Engineer</h3>
                <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Technician / Engineer</p>
                    <p className="text-xs text-muted-foreground">Select an active engineer from your store branch to fulfill this job.</p>
                  </div>
                  <Select
                    value={selectedOrder.assignedEngineer?.id || ""}
                    onValueChange={(val) => {
                      assignEngineerMutation.mutate({ orderId: selectedOrder.orderId, engineerId: val });
                      const eng = branchEngineers.find(e => e.id === val);
                      if (eng) setSelectedOrder({ ...selectedOrder, assignedEngineer: eng as any });
                    }}
                    disabled={assignEngineerMutation.isPending}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] text-xs font-medium">
                      <SelectValue placeholder="Select Branch Engineer" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchEngineers.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground">No branch engineers found</div>
                      ) : (
                        branchEngineers.map(eng => {
                          const name = eng.firstName && eng.lastName ? `${eng.firstName} ${eng.lastName}` : (eng.fullName || "Engineer");
                          return (
                            <SelectItem key={eng.id} value={eng.id}>{name} ({eng.phoneNumber})</SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Order Items</h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.orderItems?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.priceAtPurchase}</TableCell>
                          <TableCell className="text-right font-semibold">₹{item.subtotal}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between items-center rounded-lg bg-primary/5 p-4 border border-primary/10">
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Payment Method:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></p>
                  <p><span className="text-muted-foreground">Payment Status:</span> <span className="font-medium">{selectedOrder.paymentStatus}</span></p>
                  <p><span className="text-muted-foreground">Delivery Method:</span> <span className="font-medium">{selectedOrder.deliveryMethod}</span></p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
