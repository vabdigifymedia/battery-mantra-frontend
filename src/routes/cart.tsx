import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/common/QuantityStepper";
import { Image } from "@/components/common/Image";
import { Price } from "@/components/common/Price";
import { Spinner } from "@/components/feedback/Spinner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FullPageLoader } from "@/components/feedback/FullPageLoader";
import { useAuth } from "@/providers/AuthProvider";
import { cartQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { cartService } from "@/services/cart.service";
import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — BatteryMantra" },
      { name: "description", content: "Review the batteries in your cart before checkout." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const enabled = status === "authenticated";
  const { data, isLoading, isError, refetch } = useQuery(cartQuery(enabled));

  const update = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      cartService.update(id, { quantity: qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Update failed"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => cartService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Remove failed"),
  });
  const clear = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Clear failed"),
  });

  if (status === "loading") return <FullPageLoader />;
  if (status !== "authenticated")
    return <Navigate to="/login" search={{ redirect: "/cart" }} />;

  const items = data?.cartItems ?? [];
  const subtotal = data?.subTotal ?? items.reduce((s, it) => s + it.product.productPrice * it.quantity, 0);
  const exchangeDiscount = data?.exchangeDiscount ?? 0;
  const totalAmount = data?.totalAmount ?? subtotal;

  return (
    <div>
      <PageHeader title="Your cart" description={`${items.length} item${items.length === 1 ? "" : "s"}`} />
      <Container size="xl" className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {isLoading ? (
            <div className="py-16 text-center">
              <Spinner />
            </div>
          ) : isError ? (
            <ErrorState
              title="Couldn't load your cart"
              onRetry={() => void refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Browse the catalogue and add batteries to get started."
              action={
                <Button asChild variant="brand">
                  <Link to="/products">Shop batteries</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.cartItemId}
                  className="flex gap-4 rounded-xl border border-border bg-card p-3 sm:p-4"
                >
                  <Link
                    to="/products/$id"
                    params={{ id: it.product.productId }}
                    className="shrink-0"
                  >
                    <Image
                      src={it.product.productImage}
                      alt={it.product.productName}
                      aspect="square"
                      className="h-24 w-24 sm:h-28 sm:w-28"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {it.product.brandName ? (
                          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {it.product.brandName}
                          </p>
                        ) : null}
                        <Link
                          to="/products/$id"
                          params={{ id: it.product.productId }}
                          className="line-clamp-2 text-sm font-semibold hover:text-primary sm:text-base"
                        >
                          {it.product.productName}
                        </Link>
                        {it.exchangeOldBattery && (
                          <div className="mt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-success bg-success/10 px-1.5 py-0.5 rounded-sm">
                              Exchange old battery (-₹1,000)
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove"
                        onClick={() => remove.mutate(it.cartItemId)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <QuantityStepper
                        value={it.quantity}
                        onChange={(q) => update.mutate({ id: it.cartItemId, qty: q })}
                        min={1}
                        max={99}
                        disabled={update.isPending}
                      />
                      <Price value={it.product.productPrice * it.quantity} size="md" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {items.length > 0 ? (
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={() => clear.mutate()} disabled={clear.isPending}>
                Clear cart
              </Button>
            </div>
          ) : null}
        </div>

        {items.length > 0 ? (
          <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-product">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">
                  <Price value={subtotal} size="sm" />
                </dd>
              </div>
              {exchangeDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Scrap Discount</dt>
                  <dd className="font-medium">
                    -<Price value={exchangeDiscount} size="sm" />
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">Calculated at checkout</dd>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd>
                  <Price value={totalAmount} size="md" />
                </dd>
              </div>
            </dl>
            <Button
              variant="brand"
              className="mt-5 w-full"
              onClick={() => navigate({ to: "/checkout" })}
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </aside>
        ) : null}
      </Container>
    </div>
  );
}
