import { createFileRoute, notFound } from "@tanstack/react-router";
import { CategoryManufacturersPage } from "@/components/manufacturers/CategoryManufacturersPage";
import { ManufacturerPage } from "@/components/manufacturers/ManufacturerPage";
import { locationService } from "@/services/location.service";
import { rootCategoriesQuery, manufacturersListQuery } from "@/queries";
import {
  assertValidRouteSlugs,
  buildPageHead,
  findCategoryBySlug,
  hasAnyInvalidRouteSlug,
  notFoundHead,
} from "@/lib/seo";
import { seoTemplatesQuery, resolveTemplateSeo } from "@/lib/seo-templates";

const toSlug = (text?: string) => text ? text.toLowerCase().replace(/\s+/g, '-') : '';

export const Route = createFileRoute("/manufacturers/$categorySlug/$slug")({
  loader: async ({ context, params }) => {
    assertValidRouteSlugs(params.categorySlug, params.slug);

    void context.queryClient.prefetchQuery(seoTemplatesQuery());

    const cities = await locationService.getPublicCities().catch(() => []);
    const isCity = cities.some(c => toSlug(c.cityName) === params.slug);

    const [categories, manufacturers, templates] = await Promise.all([
      context.queryClient.ensureQueryData(rootCategoriesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(manufacturersListQuery()).catch(() => []),
      context.queryClient.ensureQueryData(seoTemplatesQuery()).catch(() => undefined),
    ]);

    if (categories.length > 0 && !findCategoryBySlug(categories, params.categorySlug)) {
      throw notFound();
    }

    return { isCity, categories, manufacturers, templates };
  },
  head: ({ loaderData, params }) => {
    if (hasAnyInvalidRouteSlug(params.categorySlug, params.slug) || !loaderData) {
      return notFoundHead();
    }
    const { isCity, categories, manufacturers, templates } = loaderData;
    const categoryName = params.categorySlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const category = findCategoryBySlug(categories, params.categorySlug);

    if (isCity) {
      const seo = resolveTemplateSeo(
        "CATEGORY",
        templates,
        { category_name: category?.categoryName || categoryName, delivery_time: "2-4 Hours" },
        (category as any)?.seo,
        {
          title: `Shop by ${categoryName} | Battery Mantra`,
          description: `Select your ${categoryName} manufacturer or brand to find compatible batteries at best prices with free installation.`,
        }
      );
      return buildPageHead(seo, { path: `/manufacturers/${params.categorySlug}/${params.slug}` });
    } else {
      const makeName = params.slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const manufacturer = manufacturers?.find((m: any) => toSlug(m.name) === params.slug);

      const seo = resolveTemplateSeo(
        "MANUFACTURER",
        templates,
        { 
          manufacturer_name: manufacturer?.name || makeName, 
          category_name: category?.categoryName || categoryName,
          delivery_time: "2-4 Hours",
        },
        (manufacturer as any)?.seo,
        {
          title: `Buy ${makeName} ${categoryName} Online at Best Price | Battery Mantra`,
          description: `Find 100% compatible batteries for all ${makeName} vehicle models at guaranteed lowest prices. Free doorstep installation & 24/7 service on Battery Mantra.`,
        }
      );
      return buildPageHead(seo, { path: `/manufacturers/${params.categorySlug}/${params.slug}` });
    }
  },
  component: DynamicSlugPage,
});

function DynamicSlugPage() {
  const { categorySlug, slug } = Route.useParams();
  const { isCity } = Route.useLoaderData();

  if (isCity) {
    return <CategoryManufacturersPage categorySlug={categorySlug} citySlug={slug} />;
  }
  
  return <ManufacturerPage categorySlug={categorySlug} makeSlug={slug} />;
}
