import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/common/Price";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Spinner } from "@/components/feedback/Spinner";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { useAuth } from "@/providers/AuthProvider";
import { ordersListQuery } from "@/queries";
import { formatDate } from "@/lib/format/date";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Your orders — BatteryMantra" },
      { name: "description", content: "Track and manage your BatteryMantra orders." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { status } = useAuth();
  const orders = useQuery(ordersListQuery(status === "authenticated"));

  if (status === "loading") return <FullPageLoader />;
  if (status !== "authenticated")
    return <Navigate to="/login" search={{ redirect: "/orders" }} />;

  return (
    <div>
      <PageHeader title="Your orders" description="Every order you've placed with us." />
      <Container size="xl" className="py-8">
        {orders.isLoading ? (
          <div className="py-12 text-center">
            <Spinner />
          </div>
        ) : orders.isError ? (
          <ErrorState title="Couldn't load orders" onRetry={() => void orders.refetch()} />
        ) : !orders.data || orders.data.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Once you place your first order it will appear here."
            action={
              <Button asChild variant="brand">
                <Link to="/products">Shop batteries</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {orders.data.map((o) => (
              <li
                key={o.orderId}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{o.orderId.slice(0, 8)}
                    </span>
                    <Badge variant="outline">{o.orderStatus}</Badge>
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">
                      {o.orderItems.length} item{o.orderItems.length === 1 ? "" : "s"}
                    </span>{" "}
                    · placed {formatDate(o.placedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Price value={o.totalAmount} size="md" />
                  <Button asChild variant="brand-outline" size="sm">
                    <Link to="/orders/$orderId" params={{ orderId: o.orderId }}>
                      View
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </div>
  );
}
