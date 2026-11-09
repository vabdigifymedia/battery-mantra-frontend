import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package2,
  User,
  Filter,
  AlertTriangle,
  Globe,
  Navigation,
  StickyNote,
  Shield,
  Banknote,
  RefreshCw,
} from "lucide-react";
import type { OrderStatus, OrderResponse } from "@/types/dto";
import type { EngineerProfile } from "@/services/engineer.service";

import { getStatusLabel, checkCityMismatch } from "./kalkaji.orders.index";

export const Route = createFileRoute("/kalkaji_/partner/orders")({
  component: PartnerOrdersPage,
});

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const TERMINAL_STATUSES = ["DELIVERED", "CANCELLED"];

const CANCELLATION_REASONS = [
  "Stock unavailable at branch",
  "Address outside reachable zone",
  "Customer requested cancellation",
  "Duplicate or incorrect order",
  "Other",
];

// ─── State Machine ───────────────────────────────────────────────────
function getAllowedTransitions(currentStatus: string, hasEngineer: boolean): string[] {
  switch (currentStatus) {
    case "PENDING":
      return ["PROCESSING", "CANCELLED"];
    case "CONFIRMED":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      // SHIPPED is only valid if engineer is assigned, but we still show it —
      // the guard check happens at action time so user sees a helpful error.
      return hasEngineer ? ["SHIPPED", "CANCELLED"] : ["SHIPPED", "CANCELLED"];
    case "SHIPPED":
      return ["DELIVERED", "CANCELLED"];
    case "DELIVERED":
    case "CANCELLED":
      return []; // terminal
    default:
      return [];
  }
}

// ─── Engineer workload helpers ───────────────────────────────────────
function getActiveOrderCount(engineerId: string, orders: OrderResponse[]): number {
  return orders.filter(
    (o) =>
      o.assignedEngineer?.id === engineerId &&
      !TERMINAL_STATUSES.includes(o.orderStatus),
  ).length;
}

function getEngineerLabel(eng: EngineerProfile, activeCount: number): string {
  const name =
    eng.firstName && eng.lastName
      ? `${eng.firstName} ${eng.lastName}`
      : eng.fullName || "Engineer";

  if (activeCount === 0) return `${name} (${eng.phoneNumber}) — 🟢 Available`;
  if (activeCount <= 2) return `${name} (${eng.phoneNumber}) — 🔵 ${activeCount} active`;
  return `${name} (${eng.phoneNumber}) — 🟠 ${activeCount} active (Busy)`;
}

// ─── Cancellation Reason Dialog ──────────────────────────────────────
function CancellationReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const finalReason = selectedReason === "Other" ? customReason.trim() : selectedReason;
  const canConfirm = selectedReason !== "" && (selectedReason !== "Other" || customReason.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Cancel Order
          </DialogTitle>
          <DialogDescription>
            Please select a reason for cancelling this order. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {CANCELLATION_REASONS.map((reason) => (
              <div key={reason} className="flex items-center space-x-3">
                <RadioGroupItem value={reason} id={`reason-${reason}`} />
                <Label htmlFor={`reason-${reason}`} className="text-sm cursor-pointer">
                  {reason}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "Other" && (
            <Textarea
              placeholder="Please describe the reason…"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Go Back
          </Button>
          <Button
            variant="destructive"
            disabled={!canConfirm || isPending}
            onClick={() => onConfirm(finalReason)}
          >
            {isPending ? "Cancelling…" : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delivery Verification Dialog ────────────────────────────────────
function DeliveryVerificationDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: OrderResponse;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [oldBatteryCollected, setOldBatteryCollected] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [securityCode, setSecurityCode] = useState("");

  // Determine which sections are applicable
  const hasExchange =
    (order.exchangeDiscount != null && order.exchangeDiscount > 0) ||
    order.orderItems?.some((i: any) => i.exchangeOldBattery);

  const isCOD =
    order.paymentMethod === "COD" || order.paymentStatus !== "PAID";

  const hasSecurityCode = !!order.deliverySecurityCode;

  const securityCodeValid = !hasSecurityCode || securityCode === order.deliverySecurityCode;

  const oldBatteryOk = !hasExchange || oldBatteryCollected;
  const paymentOk = !isCOD || paymentReceived;

  const canConfirm = oldBatteryOk && paymentOk && securityCodeValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <Shield className="h-5 w-5" /> Delivery Verification
          </DialogTitle>
          <DialogDescription>
            Complete the following checks before marking this order as delivered.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* (a) Old Battery Exchange */}
          {hasExchange && (
            <div className="space-y-2 rounded-lg border p-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Old Battery Exchange
              </h4>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="old-battery"
                  checked={oldBatteryCollected}
                  onCheckedChange={(c) => setOldBatteryCollected(c === true)}
                />
                <Label htmlFor="old-battery" className="text-sm cursor-pointer leading-snug">
                  Old battery collected from customer
                </Label>
              </div>
              {!oldBatteryCollected && (
                <div className="rounded bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Exchange discount of ₹{order.exchangeDiscount?.toLocaleString() ?? 0} will need
                    to be collected additionally. New payable: ₹
                    {((order.totalAmount || 0) + (order.exchangeDiscount || 0)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* (b) COD Payment Verification */}
          {isCOD && (
            <div className="space-y-2 rounded-lg border p-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4" /> COD Payment Verification
              </h4>
              <p className="text-sm text-muted-foreground">
                Collect <span className="font-bold text-foreground">₹{order.totalAmount.toLocaleString()}</span> via
                Cash / Doorstep UPI
              </p>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="payment-received"
                  checked={paymentReceived}
                  onCheckedChange={(c) => setPaymentReceived(c === true)}
                />
                <Label htmlFor="payment-received" className="text-sm cursor-pointer leading-snug">
                  Payment received from customer
                </Label>
              </div>
            </div>
          )}

          {/* (c) Security Code Verification */}
          {hasSecurityCode && (
            <div className="space-y-2 rounded-lg border p-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" /> Security Code Verification
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="security-code" className="text-sm">
                  Enter 4-digit delivery security code
                </Label>
                <Input
                  id="security-code"
                  placeholder="e.g. 1234"
                  maxLength={4}
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  className="max-w-[180px] tracking-widest text-center font-mono"
                />
                {securityCode.length > 0 && !securityCodeValid && (
                  <p className="text-xs text-red-500">Security code does not match.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button disabled={!canConfirm || isPending} onClick={onConfirm}>
            {isPending ? "Confirming…" : "Confirm Delivery"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
function PartnerOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  // Internal Notes state
  const [noteText, setNoteText] = useState("");

  // Cancellation dialog state
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Delivery verification dialog state
  const [deliveringOrder, setDeliveringOrder] = useState<OrderResponse | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["partner", "orders"],
    queryFn: ({ signal }) => partnerDashboardService.listAssignedOrders(signal),
  });

  const { data: branchEngineers = [] } = useQuery({
    queryKey: ["partner", "engineers"],
    queryFn: ({ signal }) => partnerDashboardService.listEngineers(signal),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
      cancellationReason,
    }: {
      orderId: string;
      status: string;
      cancellationReason?: string;
    }) => partnerDashboardService.updateOrderStatus(orderId, status, cancellationReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "orders"] });
      toast.success("Order status updated");
      setCancellingOrderId(null);
      setDeliveringOrder(null);
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

  const addNoteMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: string; note: string }) =>
      partnerDashboardService.addOrderNote(orderId, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["partner", "orders"] });
      toast.success("Note saved");
      setNoteText("");
      // Optimistically update the selected order's engineerNotes
      if (selectedOrder && selectedOrder.orderId === variables.orderId) {
        setSelectedOrder({ ...selectedOrder, engineerNotes: variables.note });
      }
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save note"),
  });

  // Sort engineers by workload (available first, then ascending active count)
  const sortedEngineers = useMemo(() => {
    return [...branchEngineers].sort((a, b) => {
      const aCount = getActiveOrderCount(a.id, orders);
      const bCount = getActiveOrderCount(b.id, orders);
      return aCount - bCount;
    });
  }, [branchEngineers, orders]);

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
      case "CONFIRMED": return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
      case "PROCESSING": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "SHIPPED": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "DELIVERED": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "CANCELLED": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  // Handle status change from the table dropdown
  const handleStatusChange = (order: OrderResponse, newStatus: string) => {
    // CANCELLED → open cancellation reason dialog
    if (newStatus === "CANCELLED") {
      setCancellingOrderId(order.orderId);
      return;
    }

    // SHIPPED → guard: must have engineer assigned
    if (newStatus === "SHIPPED" && !order.assignedEngineer) {
      toast.error("Please assign an engineer before marking as Shipped");
      return;
    }

    // DELIVERED → open delivery verification dialog
    if (newStatus === "DELIVERED") {
      setDeliveringOrder(order);
      return;
    }

    // All other transitions — execute directly
    updateStatusMutation.mutate({ orderId: order.orderId, status: newStatus });
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
              filteredOrders.map((order) => {
                const isTerminal = TERMINAL_STATUSES.includes(order.orderStatus);
                const hasEngineer = !!order.assignedEngineer;
                const allowed = getAllowedTransitions(order.orderStatus, hasEngineer);

                return (
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
                      {order.placedAt ? new Date(order.placedAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.shippingAddress?.substring(0, 30)}...</div>
                      {order.selectedCity && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
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
                    </TableCell>
                    <TableCell>
                      {isTerminal ? (
                        /* Terminal status — static badge, no dropdown */
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusColor(order.orderStatus)}`}
                        >
                          {order.orderStatus === "DELIVERED" ? "✅ " : "❌ "}
                          {getStatusLabel(order.orderStatus)}
                        </span>
                      ) : (
                        /* Active status — dropdown with allowed transitions only */
                        <Select
                          value={order.orderStatus}
                          onValueChange={(val) => handleStatusChange(order, val)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className={`h-8 w-[150px] border ${getStatusColor(order.orderStatus)}`}>
                            <SelectValue>{getStatusLabel(order.orderStatus)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {/* Current status shown but disabled so user sees context */}
                            <SelectItem value={order.orderStatus} disabled>
                              {getStatusLabel(order.orderStatus)} (current)
                            </SelectItem>
                            {allowed.map((s) => (
                              <SelectItem key={s} value={s}>
                                {getStatusLabel(s)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{order.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedOrder(order);
                        setNoteText(order.engineerNotes || "");
                      }}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Cancellation Reason Dialog ─────────────────────────────── */}
      <CancellationReasonDialog
        open={!!cancellingOrderId}
        onOpenChange={(v) => { if (!v) setCancellingOrderId(null); }}
        isPending={updateStatusMutation.isPending}
        onConfirm={(reason) => {
          if (cancellingOrderId) {
            updateStatusMutation.mutate({
              orderId: cancellingOrderId,
              status: "CANCELLED",
              cancellationReason: reason,
            });
          }
        }}
      />

      {/* ─── Delivery Verification Dialog ───────────────────────────── */}
      {deliveringOrder && (
        <DeliveryVerificationDialog
          open={!!deliveringOrder}
          onOpenChange={(v) => { if (!v) setDeliveringOrder(null); }}
          order={deliveringOrder}
          isPending={updateStatusMutation.isPending}
          onConfirm={() => {
            updateStatusMutation.mutate({
              orderId: deliveringOrder.orderId,
              status: "DELIVERED",
            });
          }}
        />
      )}

      {/* ─── Order Details Modal ────────────────────────────────────── */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
                  <p className="text-sm">{selectedOrder.placedAt ? new Date(selectedOrder.placedAt).toLocaleString() : "—"}</p>
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
                  <div className="rounded-lg bg-muted/60 p-2 border text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                        Website Selected City:
                      </span>
                      <span className="font-semibold text-foreground px-2 py-0.5 rounded bg-background border">
                        {selectedOrder.selectedCity || "Not recorded"}
                      </span>
                    </div>
                    {checkCityMismatch(selectedOrder.selectedCity, selectedOrder.shippingAddress) && (
                      <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs mt-1">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span><strong>Mismatch:</strong> Customer selected "{selectedOrder.selectedCity}" on website, but delivery address may belong to another city.</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedOrder.shippingAddress}
                  </p>

                  {/* ── Direct Actions: Maps / Call / WhatsApp ────── */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.shippingAddress || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-3.5 w-3.5 mr-1.5" /> Open in Maps
                      </a>
                    </Button>
                    {selectedOrder.customerPhone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${selectedOrder.customerPhone}`}>
                          <Phone className="h-3.5 w-3.5 mr-1.5" /> Call Customer
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Cancellation Reason (if cancelled) ──────────────── */}
              {selectedOrder.orderStatus === "CANCELLED" && selectedOrder.cancellationReason && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-1">
                  <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Cancellation Reason
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.cancellationReason}</p>
                  {selectedOrder.cancelledBy && (
                    <p className="text-xs text-muted-foreground">Cancelled by: {selectedOrder.cancelledBy}</p>
                  )}
                </div>
              )}

              {/* ── Assign Branch Engineer ──────────────────────────── */}
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
                      const eng = branchEngineers.find((e) => e.id === val);
                      if (eng) setSelectedOrder({ ...selectedOrder, assignedEngineer: eng as any });
                    }}
                    disabled={assignEngineerMutation.isPending}
                  >
                    <SelectTrigger className="w-full sm:w-[280px] text-xs font-medium">
                      <SelectValue placeholder="Select Branch Engineer" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedEngineers.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground">No branch engineers found</div>
                      ) : (
                        sortedEngineers.map((eng) => {
                          const activeCount = getActiveOrderCount(eng.id, orders);
                          return (
                            <SelectItem key={eng.id} value={eng.id}>
                              {getEngineerLabel(eng, activeCount)}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── Order Items ─────────────────────────────────────── */}
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

              {/* ── Payment & Total ─────────────────────────────────── */}
              <div className="flex justify-between items-center rounded-lg bg-primary/5 p-4 border border-primary/10">
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Payment Method:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></p>
                  <p><span className="text-muted-foreground">Payment Status:</span> <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs ml-1 inline-block">{selectedOrder.paymentStatus || (selectedOrder.orderStatus === "CONFIRMED" ? "PAID" : "PENDING")}</span></p>
                  <p><span className="text-muted-foreground">Delivery Method:</span> <span className="font-medium">{selectedOrder.deliveryMethod}</span></p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* ── Internal Notes / Installation Remarks ──────────── */}
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Internal Notes / Installation Remarks
                </h3>

                {selectedOrder.engineerNotes && (
                  <div className="rounded bg-muted/50 border p-3 text-sm whitespace-pre-wrap text-muted-foreground">
                    {selectedOrder.engineerNotes}
                  </div>
                )}

                <Textarea
                  placeholder="e.g. Customer requested 5 PM slot, car parked in basement B2"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!noteText.trim() || addNoteMutation.isPending}
                    onClick={() => {
                      addNoteMutation.mutate({ orderId: selectedOrder.orderId, note: noteText.trim() });
                    }}
                  >
                    {addNoteMutation.isPending ? "Saving…" : "Save Note"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
