import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { adminService } from "@/services/admin.service";
import { productsService } from "@/services/products.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/feedback/Spinner";
import { toast } from "sonner";
import { ArrowLeft, Search, Plus, MapPin, Pencil, Phone, Mail, X, User as UserIcon } from "lucide-react";
import { AdminEditCustomerModal } from "@/components/admin/AdminEditCustomerModal";
import type { AdminCreateOrderRequest, AdminCreateCustomerRequest } from "@/services/admin.service";
import type { UserResponse } from "@/types/dto";

export const Route = createFileRoute("/kalkaji/orders/create")({
  component: AdminCreateOrder,
});

function AdminCreateOrder() {
  const navigate = useNavigate();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { quantity: number; exchange: boolean; originalPrice: number; exchangeDiscount: number }>>({});
  const [discount, setDiscount] = useState<number>(0);
  const [deliveryMethod, setDeliveryMethod] = useState("HOME_INSTALLATION");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [installationDate, setInstallationDate] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Queries
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminService.getAllUsers(),
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", "list"],
    queryFn: () => productsService.list(),
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.productName.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  // Selected & Filtered Customers
  const selectedCustomer = useMemo(() => {
    return (users as UserResponse[]).find(u => u.userId === selectedCustomerId) || null;
  }, [users, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return users as UserResponse[];
    const query = customerSearch.toLowerCase().trim();
    return (users as UserResponse[]).filter((u: any) => {
      const name = (u.name || u.username || "").toLowerCase();
      const phone = (u.phone || u.phoneNumber || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(query) || phone.includes(query) || email.includes(query);
    });
  }, [users, customerSearch]);

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: (data: AdminCreateCustomerRequest) => adminService.createCustomer(data),
    onSuccess: (newUser) => {
      toast.success("Customer created successfully!");
      refetchUsers();
      setSelectedCustomerId(newUser.userId);
      setIsCustomerModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create customer");
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: AdminCreateOrderRequest) => adminService.createOrder(data),
    onSuccess: () => {
      toast.success("Order created successfully!");
      navigate({ to: "/kalkaji/orders" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create order");
    }
  });

  // Handlers
  const handleProductToggle = (productId: string, product: any, checked: boolean) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (checked) {
        next[productId] = { quantity: 1, exchange: true, originalPrice: product.productPrice, exchangeDiscount: product.exchangeDiscount || 0 };
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const handleProductChange = (productId: string, field: 'quantity' | 'exchange', value: any) => {
    setSelectedProducts(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: { ...prev[productId], [field]: value }
      };
    });
  };

  const handleSubmitOrder = () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    
    const items = Object.entries(selectedProducts).map(([productId, config]) => ({
      productId,
      quantity: config.quantity,
      exchangeOldBattery: config.exchange
    }));

    if (items.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    createOrderMutation.mutate({
      customerId: selectedCustomerId,
      items,
      discount: discount,
      deliveryMethod,
      paymentMethod,
      installationDate: installationDate ? installationDate : undefined
    });
  };

  // Calculations
  const subTotal = Object.values(selectedProducts).reduce((acc, curr) => acc + (curr.originalPrice * curr.quantity), 0);
  const totalExchangeDiscount = Object.values(selectedProducts).reduce((acc, curr) => acc + (curr.exchange ? curr.exchangeDiscount * curr.quantity : 0), 0);
  const finalTotal = Math.max(0, subTotal - totalExchangeDiscount - discount);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/kalkaji/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Create Manual Order</h2>
          <p className="text-muted-foreground mt-1">Create an order for a walk-in or phone customer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Selection */}
          <Card>
            <CardHeader className="pb-4 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Customer Information</CardTitle>
                <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Plus className="h-4 w-4 mr-1" /> New Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Customer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createCustomerMutation.mutate({
                        name: formData.get("name") as string,
                        phone: formData.get("phone") as string,
                        email: formData.get("email") as string,
                        addressLine1: formData.get("addressLine1") as string,
                        addressLine2: formData.get("addressLine2") as string,
                        city: formData.get("city") as string,
                        state: formData.get("state") as string,
                        pincode: formData.get("pincode") as string,
                      });
                    }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name *</Label>
                          <Input name="name" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input name="phone" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email (Optional)</Label>
                        <Input name="email" type="email" />
                      </div>
                      <div className="space-y-2">
                        <Label>Address Line 1 *</Label>
                        <Input name="addressLine1" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Address Line 2 (Optional)</Label>
                        <Input name="addressLine2" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>City *</Label>
                          <Input name="city" required />
                        </div>
                        <div className="space-y-2">
                          <Label>State *</Label>
                          <Input name="state" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Pincode *</Label>
                          <Input name="pincode" required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full mt-4" disabled={createCustomerMutation.isPending}>
                        {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingUsers ? (
                <div className="h-24 flex items-center justify-center text-muted-foreground">
                  <Spinner size="sm" className="mr-2" /> Loading customers...
                </div>
              ) : selectedCustomer ? (
                /* Selected Customer Summary Card */
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                        {((selectedCustomer.name || selectedCustomer.username || "C")[0] || "C").toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {selectedCustomer.name || selectedCustomer.username}
                          </span>
                          <Badge variant={selectedCustomer.role === "ADMIN" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                            {selectedCustomer.role}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                          {((selectedCustomer as any).phone || selectedCustomer.phoneNumber) && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3" />
                              {(selectedCustomer as any).phone || selectedCustomer.phoneNumber}
                            </span>
                          )}
                          {selectedCustomer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {selectedCustomer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs shadow-xs"
                        onClick={() => setIsEditCustomerModalOpen(true)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit Customer</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedCustomerId("");
                          setCustomerSearch("");
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Customer Address Preview if present */}
                  {((selectedCustomer as any).addressLine1 || (selectedCustomer as any).addresses?.[0]) && (
                    <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                      <span className="truncate">
                        {(selectedCustomer as any).addressLine1 || (selectedCustomer as any).addresses?.[0]?.addressLine1}
                        {((selectedCustomer as any).city || (selectedCustomer as any).addresses?.[0]?.city) && `, ${(selectedCustomer as any).city || (selectedCustomer as any).addresses?.[0]?.city}`}
                        {((selectedCustomer as any).pincode || (selectedCustomer as any).addresses?.[0]?.pincode) && ` - ${(selectedCustomer as any).pincode || (selectedCustomer as any).addresses?.[0]?.pincode}`}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Search Customer List */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Search & Select Customer *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by customer name, phone number, or email..."
                        className="pl-9 pr-8 h-10"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        autoFocus={false}
                      />
                      {customerSearch && (
                        <button
                          type="button"
                          onClick={() => setCustomerSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredCustomers.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground space-y-2">
                      <p>No customers found matching &quot;{customerSearch}&quot;.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="h-8 gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create New Customer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1 border rounded-md divide-y bg-background/50">
                      {filteredCustomers.map((user: any) => {
                        const name = user.name || user.username || "Customer";
                        const phone = user.phone || user.phoneNumber || "";
                        const email = user.email || "";
                        return (
                          <button
                            key={user.userId}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(user.userId);
                              setCustomerSearch("");
                            }}
                            className="w-full text-left p-2.5 hover:bg-muted/60 transition-colors flex items-center justify-between gap-3 text-sm group"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                {name}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2 font-mono">
                                {phone && <span>{phone}</span>}
                                {email && <span className="font-sans truncate">({email})</span>}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0 group-hover:border-primary group-hover:text-primary">
                              Select
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {filteredCustomers.length} customer{filteredCustomers.length === 1 ? "" : "s"} available. Click any customer to select.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader className="pb-4 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Select Products</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search product name..." 
                    className="pl-8 h-9"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[100px]">Stock</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[200px]">Pricing Option</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingProducts ? (
                      <TableRow><TableCell colSpan={5} className="h-32 text-center"><Spinner /></TableCell></TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No products found</TableCell></TableRow>
                    ) : (
                      filteredProducts.map(product => {
                        const isSelected = !!selectedProducts[product.productId];
                        const config = selectedProducts[product.productId];

                        return (
                          <TableRow key={product.productId} className={isSelected ? "bg-primary/5" : ""}>
                            <TableCell>
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={(c) => handleProductToggle(product.productId, product, !!c)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {product.productImage ? (
                                  <img src={product.productImage} className="w-10 h-10 object-cover rounded border bg-card" />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center border"><MapPin className="h-4 w-4 text-muted-foreground" /></div>
                                )}
                                <div>
                                  <p className="font-medium text-sm line-clamp-1">{product.productName}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{product.brandName} • {product.capacity}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const stock = (product as any).stockQuantity ?? (product as any).productStock;
                                const isAvailable = stock === undefined || stock > 0;
                                return (
                                  <span className={`text-xs font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                    {stock !== undefined ? `${stock} in stock` : 'In stock'}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="1" 
                                className="h-8 px-2" 
                                disabled={!isSelected}
                                value={isSelected ? config.quantity : ""}
                                onChange={(e) => handleProductChange(product.productId, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            </TableCell>
                            <TableCell>
                              <RadioGroup 
                                disabled={!isSelected}
                                value={isSelected ? (config.exchange ? "with" : "without") : undefined}
                                onValueChange={(val) => handleProductChange(product.productId, 'exchange', val === 'with')}
                                className="gap-1.5"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="with" id={`with-${product.productId}`} className="h-3.5 w-3.5" />
                                  <Label htmlFor={`with-${product.productId}`} className="text-xs font-medium">
                                    ₹{Math.max(0, product.productPrice - (product.exchangeDiscount || 0)).toLocaleString()} (With Old)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="without" id={`without-${product.productId}`} className="h-3.5 w-3.5" />
                                  <Label htmlFor={`without-${product.productId}`} className="text-xs font-medium text-muted-foreground">
                                    ₹{product.productPrice.toLocaleString()} (Without Old)
                                  </Label>
                                </div>
                              </RadioGroup>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg">Order Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">Cash on Delivery (COD)</SelectItem>
                    <SelectItem value="ONLINE">Online Payment (Prepaid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Delivery Method</Label>
                <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME_INSTALLATION">Home Installation</SelectItem>
                    <SelectItem value="STANDARD_DELIVERY">Standard Delivery</SelectItem>
                    <SelectItem value="STORE_PICKUP">Store Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {deliveryMethod === "HOME_INSTALLATION" && (
                <div className="space-y-2">
                  <Label>Installation Date</Label>
                  <Input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-4 border-b border-primary/10">
              <CardTitle className="text-lg text-primary">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items ({Object.values(selectedProducts).reduce((a,c) => a + c.quantity, 0)})</span>
                <span className="font-medium">₹{subTotal.toLocaleString()}</span>
              </div>
              
              {totalExchangeDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Exchange Discount</span>
                  <span className="font-medium">- ₹{totalExchangeDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-muted-foreground">Extra Discount</span>
                <div className="flex items-center gap-1 w-24">
                  <span className="text-muted-foreground font-medium">₹</span>
                  <Input 
                    type="number" 
                    min="0"
                    value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-7 text-right px-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-primary/10 flex justify-between items-center text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-primary">₹{finalTotal.toLocaleString()}</span>
              </div>

              <Button 
                className="w-full mt-4 h-11 font-semibold text-sm shadow-sm" 
                size="lg"
                onClick={handleSubmitOrder}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? "Creating Order..." : "Confirm & Create Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Selected Customer Modal */}
      {isEditCustomerModalOpen && selectedCustomer && (
        <AdminEditCustomerModal
          customer={selectedCustomer}
          isOpen={isEditCustomerModalOpen}
          onClose={() => setIsEditCustomerModalOpen(false)}
          onSuccess={(updatedUser) => {
            refetchUsers();
            setSelectedCustomerId(updatedUser.userId);
            setIsEditCustomerModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
