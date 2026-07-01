import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, ShoppingCart, Zap } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductGallery } from "@/components/products/ProductGallery";
import { SpecificationsTable } from "@/components/products/SpecificationsTable";
import { Price } from "@/components/common/Price";
import { QuantityStepper } from "@/components/common/QuantityStepper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ApiError } from "@/lib/api/errors";
import { productDetailQuery } from "@/queries";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/providers/AuthProvider";
import { cartService } from "@/services/cart.service";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/products/$id")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(productDetailQuery(params.id));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw notFound();
      throw e;
    }
  },
  head: () => ({
    meta: [{ title: "Product · BatteryMantra" }, { name: "robots", content: "index,follow" }],
  }),
  component: PdpPage,
  errorComponent: ({ error, reset }) => (
    <Container size="lg" className="py-12">
      <ErrorState
        title="Couldn't load this product"
        description={error.message}
        onRetry={reset}
      />
    </Container>
  ),
  notFoundComponent: () => (
    <Container size="lg" className="py-12">
      <EmptyState
        title="Product not found"
        description="The product you're looking for doesn't exist or was removed."
        action={
          <Button asChild variant="brand">
            <Link to="/products">Back to shop</Link>
          </Button>
        }
      />
    </Container>
  ),
});

function PdpPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(productDetailQuery(id));
  const { status } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);

  const inStock = (data.productStock ?? 0) > 0;

  const addToCart = useMutation({
    mutationFn: () => cartService.add({ productId: data.productId, quantity: qty }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      toast.success(`Added ${qty} × ${data.productName} to cart`);
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : "Could not add to cart.");
    },
  });

  const onAdd = () => {
    if (status !== "authenticated") {
      toast.info("Please sign in to add items to your cart.");
      navigate({ to: "/login", search: { redirect: `/products/${id}` } });
      return;
    }
    addToCart.mutate();
  };

  const onBuyNow = () => {
    if (status !== "authenticated") {
      navigate({ to: "/login", search: { redirect: `/products/${id}` } });
      return;
    }
    addToCart.mutate(undefined, {
      onSuccess: () => navigate({ to: "/checkout" }),
    });
  };

  return (
    <div>
      <Container size="xl" className="py-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/products">Shop</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[40ch]">
                {data.productName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Container>

      <Container size="xl" className="grid gap-10 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ProductGallery primaryImage={data.productImage} alt={data.productName} />

        <div className="space-y-5">
          {data.brandName ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {data.brandName}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {data.productName}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <Price value={data.productPrice} size="xl" />
            {inStock ? (
              <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> In stock
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-destructive/40 bg-destructive/10 text-destructive"
              >
                Out of stock
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <QuantityStepper
              value={qty}
              onChange={setQty}
              min={1}
              max={Math.max(1, data.productStock ?? 10)}
              disabled={!inStock}
            />
            <Button
              variant="brand"
              size="lg"
              onClick={onAdd}
              disabled={!inStock || addToCart.isPending}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </Button>
            <Button
              variant="brand-outline"
              size="lg"
              onClick={onBuyNow}
              disabled={!inStock || addToCart.isPending}
            >
              <Zap className="h-4 w-4" />
              Buy now
            </Button>
          </div>

          {data.categoryName ? (
            <p className="pt-2 text-xs text-muted-foreground">
              Category:{" "}
              <span className="font-medium text-foreground">{data.categoryName}</span>
            </p>
          ) : null}
        </div>
      </Container>

      <Container size="xl" className="space-y-10 pb-16">
        {data.productDescription ? (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {data.productDescription}
            </p>
          </section>
        ) : null}

        {data.specs && Object.keys(data.specs).length > 0 ? (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Specifications</h2>
            <SpecificationsTable specs={data.specs} />
          </section>
        ) : null}

        {data.compatibleVehicles && data.compatibleVehicles.length > 0 ? (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Compatible vehicles</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.compatibleVehicles.map((v) => (
                <li
                  key={v.vehicleId}
                  className="rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <div className="font-medium">
                    {v.make} {v.model}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {[
                      v.fuelType,
                      v.yearFrom && v.yearTo ? `${v.yearFrom}–${v.yearTo}` : v.yearFrom || v.yearTo,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </div>
  );
}
