import { createFileRoute, redirect } from "@tanstack/react-router";
import { productSearchSchema } from "@/lib/schemas/productSearchSchema";
import { assertValidRouteSlugs } from "@/lib/seo";

export const Route = createFileRoute("/shop/$categorySlug/$brandSlug/$citySlug")({
  validateSearch: productSearchSchema,
  beforeLoad: ({ params, search }) => {
    assertValidRouteSlugs(params.categorySlug, params.brandSlug, params.citySlug);
    throw redirect({
      to: "/brand-products/$categorySlug/$brandSlug/$citySlug",
      params: {
        categorySlug: params.categorySlug,
        brandSlug: params.brandSlug,
        citySlug: params.citySlug,
      },
      search,
      statusCode: 301,
    });
  },
  component: () => null,
});
