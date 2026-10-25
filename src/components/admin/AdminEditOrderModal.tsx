"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService, AdminUpdateOrderRequest, AdminUpdateOrderItemRequest } from "@/services/admin.service";
import { productsService } from "@/services/products.service";
import { locationService } from "@/services/location.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/feedback/Spinner";
import {
  MapPin,
  Package,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  Wrench,
  AlertTriangle,
  Receipt,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderResponse, ProductListResponse } from "@/types/dto";

interface AdminEditOrderModalProps {
  order: OrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedOrder: OrderResponse) => void;
}

interface EditableOrderItem {
  productId: string;
  quantity: number;
  exchangeOldBattery: boolean;
  productName?: string;
  productPrice?: number;
  exchangeDiscount?: number;
  productImage?: string;
}

export function AdminEditOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: AdminEditOrderModalProps) {
  const queryClient = useQueryClient();

  // Load public cities to match order city
  const { data: publicCities = [] } = useQuery({
    queryKey: ["locations", "public-cities"],
    queryFn: locationService.getPublicCities,
    staleTime: 10 * 60_000,
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<"address" | "items" | "billing">("address");

  // Form State
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Determine matched city ID from order's selectedCity or city (or current form city)
  const matchedCityId = useMemo(() => {
    if (!publicCities.length) return undefined;
    const targetCity = (selectedCity || city || order?.selectedCity || order?.city || "").trim().toLowerCase();
    if (!targetCity) return undefined;
    const found = publicCities.find((c) => {
      const cName = c.cityName.trim().toLowerCase();
      return cName === targetCity || targetCity.includes(cName) || cName.includes(targetCity);
    });
    return found?.cityId;
  }, [publicCities, selectedCity, city, order?.selectedCity, order?.city]);

  const matchedCityName = useMemo(() => {
    if (!matchedCityId || !publicCities.length) return undefined;
    return publicCities.find((c) => c.cityId === matchedCityId)?.cityName;
  }, [matchedCityId, publicCities]);

  // Load available products for selection with city-specific pricing
  const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", "list", matchedCityId],
    queryFn: () => productsService.list(matchedCityId),
  });

  const [items, setItems] = useState<EditableOrderItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState("HOME_INSTALLATION");
  const [installationDate, setInstallationDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "FAILED" | "REFUNDED">("PENDING");
  const [paymentMode, setPaymentMode] = useState<string>("UPI");
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [engineerNotes, setEngineerNotes] = useState("");

  // Product search filter in item picker
  const [productSearch, setProductSearch] = useState("");

  // Populate order details on open
  useEffect(() => {
    if (order) {
      setRecipientName(order.customerName || "");
      setRecipientPhone(order.customerPhone || "");

      // Address parsing: Read structured fields directly from backend first
      if (order.addressLine1 || order.city) {
        setAddressLine1(order.addressLine1 || "");
        setAddressLine2(order.addressLine2 || "");
        setCity(order.city || order.selectedCity || "");
        setState(order.state || "");
        setPincode(order.postalCode || (order as any).pincode || "");
      } else if (typeof order.shippingAddress === "object" && order.shippingAddress !== null) {
        const addr = order.shippingAddress;
        setAddressLine1(addr.addressLine1 || addr.line1 || "");
        setAddressLine2(addr.addressLine2 || addr.line2 || "");
        setCity(addr.city || order.selectedCity || "");
        setState(addr.state || "");
        setPincode(addr.pincode || addr.postalCode || "");
      } else {
        // Clean fallback ignoring trailing "India"
        const rawAddr = typeof order.shippingAddress === "string" ? order.shippingAddress : "";
        const parts = rawAddr.split(",").map((s) => s.trim()).filter((s) => s.toLowerCase() !== "india" && s.length > 0);
        const pinMatch = rawAddr.match(/\b\d{6}\b/);
        setPincode(pinMatch ? pinMatch[0] : "");
        setCity(order.selectedCity || (parts.length >= 2 ? parts[parts.length - 2] : ""));
        setState(parts.length >= 1 ? parts[parts.length - 1].replace(/\b\d{6}\b/, "").trim() : "");
        setAddressLine1(parts[0] || "");
        setAddressLine2(parts.slice(1, Math.max(1, parts.length - 2)).join(", "));
      }

      setSelectedCity(order.selectedCity || "");
      setDeliveryMethod(order.deliveryMethod || "HOME_INSTALLATION");
      setInstallationDate(order.installationDate ? order.installationDate.split("T")[0] : "");

      const initialMethod = (order.paymentMethod?.toUpperCase() === "ONLINE" ? "ONLINE" : "COD") as "COD" | "ONLINE";
      setPaymentMethod(initialMethod);

      const rawStatus = (order.paymentStatus || "").toUpperCase();
      const initialStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" = 
        rawStatus === "PAID" || rawStatus === "COMPLETED" 
          ? "PAID" 
          : rawStatus === "FAILED" 
          ? "FAILED" 
          : rawStatus === "REFUNDED" 
          ? "REFUNDED" 
          : "PENDING";
      setPaymentStatus(initialStatus);

      setPaymentMode(order.paymentMode || (initialMethod === "ONLINE" ? "UPI" : "CASH"));

      setManualDiscount(order.discountAmount || 0);
      setEngineerNotes((order as any).engineerNotes || "");

      // Populate items
      const rawItems = order.orderItems || order.items || [];
      if (rawItems.length > 0) {
        setItems(
          rawItems.map((it: any) => ({
            productId: it.productId,
            quantity: it.quantity || 1,
            exchangeOldBattery: Boolean(it.exchangeOldBattery),
            productName: it.productName || "Product",
            productPrice: it.priceAtPurchase ?? it.productPrice ?? 0,
            exchangeDiscount: it.exchangeDiscount ?? 0,
            productImage: it.productImage || "",
          }))
        );
      } else {
        setItems([]);
      }
    }
  }, [order]);

  // Sync item details (pricing, exchange discount, name) with city-specific catalog when loaded
  useEffect(() => {
    if (allProducts.length > 0 && items.length > 0) {
      setItems((prevItems) => {
        let hasChanges = false;
        const updated = prevItems.map((item) => {
          const prod = allProducts.find((p) => p.productId === item.productId);
          if (prod) {
            const newPrice = prod.productPrice;
            const newDisc = prod.exchangeDiscount ?? 0;
            const newName = prod.productName;
            if (
              item.productPrice !== newPrice ||
              item.exchangeDiscount !== newDisc ||
              item.productName !== newName
            ) {
              hasChanges = true;
              return {
                ...item,
                productName: newName,
                productPrice: newPrice,
                exchangeDiscount: newDisc,
                productImage: prod.productImage || item.productImage,
              };
            }
          }
          return item;
        });
        return hasChanges ? updated : prevItems;
      });
    }
  }, [allProducts]);

  // Calculations
  const calculatedSubtotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = allProducts.find((prod) => prod.productId === it.productId);
      const price = p?.productPrice ?? it.productPrice ?? 0;
      return sum + price * it.quantity;
    }, 0);
  }, [items, allProducts]);

  const calculatedScrapDiscount = useMemo(() => {
    return items.reduce((sum, it) => {
      if (!it.exchangeOldBattery) return sum;
      const p = allProducts.find((prod) => prod.productId === it.productId);
      const disc = p?.exchangeDiscount ?? it.exchangeDiscount ?? 0;
      return sum + disc * it.quantity;
    }, 0);
  }, [items, allProducts]);

  const finalTotalAmount = useMemo(() => {
    return Math.max(0, calculatedSubtotal - calculatedScrapDiscount - (Number(manualDiscount) || 0));
  }, [calculatedSubtotal, calculatedScrapDiscount, manualDiscount]);

  // Check if order is non-editable
  const isLocked = order ? ["DELIVERED", "INSTALLED", "CANCELLED"].includes(order.orderStatus) : false;

  // Add Item
  const handleAddItem = () => {
    const defaultProd = allProducts[0];
    if (!defaultProd) return;
    setItems([
      ...items,
      {
        productId: defaultProd.productId,
        quantity: 1,
        exchangeOldBattery: true,
        productName: defaultProd.productName,
        productPrice: defaultProd.productPrice,
        exchangeDiscount: defaultProd.exchangeDiscount || 0,
        productImage: defaultProd.productImage || "",
      },
    ]);
  };

  // Change Item Product
  const handleChangeProduct = (index: number, newProductId: string) => {
    const prod = allProducts.find((p) => p.productId === newProductId);
    if (!prod) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: newProductId,
      productName: prod.productName,
      productPrice: prod.productPrice,
      exchangeDiscount: prod.exchangeDiscount || 0,
      productImage: prod.productImage || "",
    };
    setItems(newItems);
  };

  // Change Item Quantity
  const handleChangeQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  // Toggle Scrap Battery Exchange
  const handleToggleExchange = (index: number, checked: boolean) => {
    const newItems = [...items];
    newItems[index].exchangeOldBattery = checked;
    setItems(newItems);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error("An order must contain at least one product item");
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Update Mutation
  const updateOrderMutation = useMutation({
    mutationFn: (data: AdminUpdateOrderRequest) => {
      if (!order?.orderId) throw new Error("No order selected");
      return adminService.updateOrder(order.orderId, data);
    },
    onSuccess: (updatedOrder) => {
      toast.success("Order updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onSuccess?.(updatedOrder);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update order");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.error(`Orders in ${order?.orderStatus} status cannot be edited`);
      return;
    }

    if (!recipientName.trim()) {
      setActiveTab("address");
      toast.error("Recipient name is required");
      return;
    }

    if (!recipientPhone.trim()) {
      setActiveTab("address");
      toast.error("Recipient phone is required");
      return;
    }

    if (!addressLine1.trim()) {
      setActiveTab("address");
      toast.error("Address Line 1 is required");
      return;
    }

    if (items.length === 0) {
      setActiveTab("items");
      toast.error("Please add at least one product item");
      return;
    }

    const payload: AdminUpdateOrderRequest = {
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim() || selectedCity || "Noida",
      state: state.trim() || undefined,
      pincode: pincode.trim(),
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        exchangeOldBattery: it.exchangeOldBattery,
      })),
      manualDiscount: Number(manualDiscount) || 0,
      totalAmount: finalTotalAmount,
      deliveryMethod,
      installationDate: installationDate || undefined,
      paymentMethod,
      paymentStatus,
      paymentMode: paymentMode || (paymentMethod === "ONLINE" ? "UPI" : "CASH"),
      engineerNotes: engineerNotes.trim() || undefined,
      selectedCity: selectedCity || city.trim() || undefined,
    };

    updateOrderMutation.mutate(payload);
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !updateOrderMutation.isPending && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Edit Order #{order.orderId?.slice(0, 8)}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Modify customer address, items, quantities, discounts, and fulfillment schedule.
                </DialogDescription>
              </div>
            </div>

            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-muted">
              {order.orderStatus}
            </span>
          </div>
        </DialogHeader>

        {isLocked && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              This order is marked as <strong>{order.orderStatus}</strong> and cannot be edited.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 h-auto p-1 bg-muted/60 rounded-xl">
                <TabsTrigger value="address" className="py-2 text-xs font-semibold gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Customer & Address
                </TabsTrigger>
                <TabsTrigger value="items" className="py-2 text-xs font-semibold gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Items ({items.length})
                </TabsTrigger>
                <TabsTrigger value="billing" className="py-2 text-xs font-semibold gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Billing & Notes
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Customer & Delivery Address */}
              <TabsContent value="address" className="space-y-4 m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="recip-name" className="text-xs font-semibold">
                      Recipient / Customer Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recip-name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      disabled={isLocked || updateOrderMutation.isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="recip-phone" className="text-xs font-semibold">
                      Recipient Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recip-phone"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      required
                      disabled={isLocked || updateOrderMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recip-addr1" className="text-xs font-semibold">
                    Delivery Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="recip-addr1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House/Flat No., Building Name, Street"
                    required
                    disabled={isLocked || updateOrderMutation.isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recip-addr2" className="text-xs font-semibold">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="recip-addr2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Landmark, Sector, Area"
                    disabled={isLocked || updateOrderMutation.isPending}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="recip-city" className="text-xs font-semibold">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recip-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Noida"
                      required
                      disabled={isLocked || updateOrderMutation.isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="recip-state" className="text-xs font-semibold">
                      State
                    </Label>
                    <Input
                      id="recip-state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Uttar Pradesh"
                      disabled={isLocked || updateOrderMutation.isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="recip-pin" className="text-xs font-semibold">
                      Pincode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recip-pin"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 201301"
                      required
                      disabled={isLocked || updateOrderMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="recip-selcity" className="text-xs font-semibold">
                    Website Branch / Selected City
                  </Label>
                  <Input
                    id="recip-selcity"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    placeholder="e.g. Noida / Delhi"
                    disabled={isLocked || updateOrderMutation.isPending}
                  />
                </div>
              </TabsContent>

              {/* Tab 2: Products & Items */}
              <TabsContent value="items" className="space-y-4 m-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Replace ordered models, adjust quantities, or toggle old battery scrap exchange.
                    </p>
                    {matchedCityName && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                        City: {matchedCityName}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddItem}
                    disabled={isLocked || updateOrderMutation.isPending}
                    className="h-8 text-xs font-semibold gap-1 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Product
                  </Button>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {items.map((item, idx) => {
                    const matchedProd = allProducts.find((p) => p.productId === item.productId);
                    const unitPrice = matchedProd?.productPrice ?? item.productPrice ?? 0;
                    const exchangeDisc = matchedProd?.exchangeDiscount ?? item.exchangeDiscount ?? 0;
                    const itemTotal = (unitPrice - (item.exchangeOldBattery ? exchangeDisc : 0)) * item.quantity;

                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-border bg-card p-3.5 shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                              Product Model #{idx + 1}
                            </Label>
                            <Select
                              value={item.productId}
                              onValueChange={(val) => handleChangeProduct(idx, val)}
                              disabled={isLocked || updateOrderMutation.isPending}
                            >
                              <SelectTrigger className="w-full text-xs font-medium">
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {allProducts.map((p) => (
                                  <SelectItem key={p.productId} value={p.productId} className="text-xs">
                                    {p.productName} (₹{p.productPrice.toLocaleString()})
                                    {p.exchangeDiscount ? ` [Scrap: -₹${p.exchangeDiscount.toLocaleString()}]` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-24">
                              <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                                Quantity
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleChangeQuantity(idx, parseInt(e.target.value) || 1)}
                                className="h-9 text-xs"
                                disabled={isLocked || updateOrderMutation.isPending}
                              />
                            </div>

                            <div className="pt-5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(idx)}
                                disabled={isLocked || updateOrderMutation.isPending || items.length <= 1}
                                className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Scrap Battery Toggle & Item Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer font-medium">
                            <Checkbox
                              checked={item.exchangeOldBattery}
                              onCheckedChange={(checked) => handleToggleExchange(idx, Boolean(checked))}
                              disabled={isLocked || updateOrderMutation.isPending}
                            />
                            <span>
                              With Scrap Old Battery Exchange
                              {exchangeDisc > 0 && (
                                <span className="text-emerald-600 font-semibold ml-1">
                                  (-₹{exchangeDisc.toLocaleString()} / unit)
                                </span>
                              )}
                            </span>
                          </label>

                          <div className="font-bold text-foreground">
                            Item Total: ₹{Math.max(0, itemTotal).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Tab 3: Billing & Installation */}
              <TabsContent value="billing" className="space-y-4 m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Delivery / Fulfillment Method</Label>
                    <Select
                      value={deliveryMethod}
                      onValueChange={setDeliveryMethod}
                      disabled={isLocked || updateOrderMutation.isPending}
                    >
                      <SelectTrigger className="text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOME_INSTALLATION">Home Installation (Doorstep)</SelectItem>
                        <SelectItem value="STORE_PICKUP">Store Pickup</SelectItem>
                        <SelectItem value="STANDARD_DELIVERY">Standard Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="install-date" className="text-xs font-semibold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Scheduled Installation Date
                    </Label>
                    <Input
                      id="install-date"
                      type="date"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className="text-xs"
                      disabled={isLocked || updateOrderMutation.isPending}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Payment & Billing Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Payment Method */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(val: "COD" | "ONLINE") => {
                          setPaymentMethod(val);
                          if (val === "COD") {
                            setPaymentMode("CASH");
                          } else if (paymentMode === "CASH") {
                            setPaymentMode("UPI");
                          }
                        }}
                        disabled={isLocked || updateOrderMutation.isPending}
                      >
                        <SelectTrigger className="text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COD">Cash On Delivery (COD)</SelectItem>
                          <SelectItem value="ONLINE">Online Payment (ONLINE)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Payment Status</Label>
                      <Select
                        value={paymentStatus}
                        onValueChange={(val: "PENDING" | "PAID" | "FAILED" | "REFUNDED") => setPaymentStatus(val)}
                        disabled={isLocked || updateOrderMutation.isPending}
                      >
                        <SelectTrigger className="text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAID">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">PAID</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="PENDING">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              <span className="text-amber-700 dark:text-amber-400 font-semibold">PENDING</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="FAILED">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              <span className="text-red-700 dark:text-red-400 font-semibold">FAILED</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="REFUNDED">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                              <span className="text-blue-700 dark:text-blue-400 font-semibold">REFUNDED</span>
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Mode */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center justify-between">
                        <span>Payment Mode</span>
                        {paymentMethod === "ONLINE" && (
                          <span className="text-[10px] text-primary font-medium">Online Mode</span>
                        )}
                      </Label>
                      <Select
                        value={paymentMode}
                        onValueChange={setPaymentMode}
                        disabled={isLocked || updateOrderMutation.isPending}
                      >
                        <SelectTrigger className="text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPI">UPI (GooglePay / PhonePe / Paytm)</SelectItem>
                          <SelectItem value="CARD">Card (Debit / Credit)</SelectItem>
                          <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                          <SelectItem value="WALLET">Digital Wallet</SelectItem>
                          <SelectItem value="CASH">Cash / COD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="manual-disc" className="text-xs font-semibold">
                    Manual Admin Discount (₹)
                  </Label>
                  <Input
                    id="manual-disc"
                    type="number"
                    min={0}
                    value={manualDiscount}
                    onChange={(e) => setManualDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="text-xs"
                    disabled={isLocked || updateOrderMutation.isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eng-notes" className="text-xs font-semibold">
                    Engineer / Dispatch Notes
                  </Label>
                  <Textarea
                    id="eng-notes"
                    value={engineerNotes}
                    onChange={(e) => setEngineerNotes(e.target.value)}
                    placeholder="e.g. Customer requested evening installation, call 30 mins before arrival."
                    className="text-xs resize-none"
                    rows={2}
                    disabled={isLocked || updateOrderMutation.isPending}
                  />
                </div>

                {/* Live Billing Price Summary */}
                <div className="rounded-xl border bg-muted/40 p-4 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Items Subtotal:</span>
                    <span>₹{calculatedSubtotal.toLocaleString()}</span>
                  </div>
                  {calculatedScrapDiscount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 font-medium">
                      <span>Total Scrap Exchange Discount:</span>
                      <span>- ₹{calculatedScrapDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {manualDiscount > 0 && (
                    <div className="flex justify-between items-center text-primary font-medium">
                      <span>Manual Discount:</span>
                      <span>- ₹{Number(manualDiscount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-sm text-foreground pt-2 border-t border-border mt-1">
                    <span>Final Calculated Total:</span>
                    <span className="text-base text-primary">₹{finalTotalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateOrderMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLocked || updateOrderMutation.isPending}
              className="flex-1 font-semibold shadow-sm"
            >
              {updateOrderMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Saving Order...
                </>
              ) : (
                "Save Order Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
