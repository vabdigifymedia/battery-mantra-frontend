import { createFileRoute, redirect } from "@tanstack/react-router";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import { assertValidRouteSlugs } from "@/lib/seo";

export const Route = createFileRoute("/shop/$categorySlug/$brandSlug/")({
  validateSearch: productSearchSchema,
  beforeLoad: ({ params, search }) => {
    assertValidRouteSlugs(params.categorySlug, params.brandSlug);
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
