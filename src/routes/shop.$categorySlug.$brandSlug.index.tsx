import { createFileRoute, redirect } from "@tanstack/react-router";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";

export const Route = createFileRoute("/shop/$categorySlug/$brandSlug/")({
  validateSearch: productSearchSchema,
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/brand-products/$categorySlug/$brandSlug",
      params: {
        categorySlug: params.categorySlug,
        brandSlug: params.brandSlug,
      },
      search,
      statusCode: 301,
    });
  },
  component: () => null,
});
