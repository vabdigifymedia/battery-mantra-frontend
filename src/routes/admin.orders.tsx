import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminOrdersQuery } from "@/queries";
import { adminService } from "@/services/admin.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import type { OrderStatus } from "@/types/dto";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery(adminOrdersQuery());

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      adminService.updateOrderStatus(orderId, { orderStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">Manage and process customer orders.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Placed At</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Spinner size="sm" className="inline-block mr-2" /> Loading orders...
                </TableCell>
              </TableRow>
            ) : !orders?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-mono text-xs">{order.orderId.slice(0, 8)}</TableCell>
                  <TableCell>{new Date(order.placedAt).toLocaleString()}</TableCell>
                  <TableCell>₹{order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={order.shippingAddress}>
                    {order.shippingAddress || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={order.orderStatus}
                      onValueChange={(val) => 
                        updateStatusMutation.mutate({ orderId: order.orderId, status: val as OrderStatus })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
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
    </div>
  );
}
