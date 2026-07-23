import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/feedback/Spinner";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle2, TrendingUp, ArrowRight, Package2, Users, Wallet, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/partner/")({
  component: PartnerOverviewDashboard,
});

function PartnerOverviewDashboard() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["partner", "orders"],
    queryFn: ({ signal }) => partnerDashboardService.listAssignedOrders(signal),
  });

  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === "PENDING" || o.orderStatus === "PROCESSING"
  ).length;
  const completedOrdersCount = orders.filter(
    (o) => o.orderStatus === "DELIVERED"
  ).length;
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "CANCELLED")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Take top 5 recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, 5);

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partner Overview</h1>
          <p className="text-muted-foreground">Monitor performance, assigned orders, and key metrics.</p>
        </div>
        <Button asChild variant="brand" className="gap-2">
          <Link to="/partner/orders">
            Manage All Orders <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Assigned</p>
              <p className="text-2xl font-bold">{totalOrdersCount}</p>
              <p className="text-xs text-muted-foreground">All time assigned orders</p>
            </div>
            <div className="rounded-full bg-blue-500/10 p-3 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Action Needed</p>
              <p className="text-2xl font-bold text-amber-600">{pendingOrdersCount}</p>
              <p className="text-xs text-muted-foreground">Pending / Processing</p>
            </div>
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{completedOrdersCount}</p>
              <p className="text-xs text-muted-foreground">Delivered & Installed</p>
            </div>
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business Volume</p>
              <p className="text-2xl font-bold text-purple-600">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Active orders value</p>
            </div>
            <div className="rounded-full bg-purple-500/10 p-3 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Technicians & Engineers
            </CardTitle>
            <CardDescription className="text-xs">
              Manage field installation staff assigned to your store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link to="/partner/engineers">Manage Engineers</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Store Inventory
            </CardTitle>
            <CardDescription className="text-xs">
              Track battery stock levels in your local warehouse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link to="/partner/inventory">View Stock</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Earnings & Payouts
            </CardTitle>
            <CardDescription className="text-xs">
              View installation commission reports and settlements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link to="/partner/earnings">View Financials</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <CardDescription>Latest orders assigned to your branch</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <Link to="/partner/orders">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Package2 className="h-6 w-6 text-muted-foreground/50" />
                      <p>No recent orders found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
                  <TableRow key={order.orderId} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium">
                      {order.orderId.split("-")[0]}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.placedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {order.shippingAddress}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs border font-medium ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      ₹{order.totalAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
