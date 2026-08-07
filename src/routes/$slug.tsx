import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cmsService } from "@/services/cms.service";
import { Container } from "@/components/layout/Container";
import { Spinner } from "@/components/feedback/Spinner";
import { APP } from "@/constants/app";

import { pageSeoQuery } from "@/queries";
import { buildPageHead } from "@/lib/seo";
import { applySeoTemplate } from "@/lib/utils";
import { useLocationStore } from "@/store/useLocationStore";

export const Route = createFileRoute("/$slug")({
  component: CmsPageRender,
  loader: async ({ context, params: { slug } }) => {
    let page = null;
    let pageSeo = null;
    try {
      page = await cmsService.getPageBySlug(slug);
    } catch (e) {
      page = null;
    }
    try {
      pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/" + slug));
    } catch (e) {
      pageSeo = null;
    }
    return { page, pageSeo };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const pageSeo = loaderData?.pageSeo?.seo;

    if (!page && !pageSeo) {
      return {
        meta: [{ title: `Page Not Found — ${APP.name}` }],
      };
    }

    const mergedSeo = {
      metaTitle: pageSeo?.metaTitle || page?.seo?.metaTitle,
      metaDescription: pageSeo?.metaDescription || page?.seo?.metaDescription,
      metaKeywords: pageSeo?.metaKeywords || page?.seo?.metaKeywords,
      ogTitle: pageSeo?.ogTitle || page?.seo?.ogTitle,
      ogDescription: pageSeo?.ogDescription || page?.seo?.ogDescription,
    };

    return buildPageHead(mergedSeo, {
      title: page ? `${page.title} — ${APP.name}` : undefined,
      description: page ? page.title : undefined,
    });
  },
});

function CmsPageRender() {
  const { slug } = Route.useParams();
  const { city } = useLocationStore();
  
  // We use initialData from the loader, but this also handles client-side refetches
  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["cms-page", slug],
    queryFn: () => cmsService.getPageBySlug(slug),
    initialData: Route.useLoaderData()?.page,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">The page you're looking for doesn't exist or is inactive.</p>
      </Container>
    );
  }

  return (
    <div className="bg-background min-h-[60vh] pb-20">
      {/* Hero Section */}
      {page.image1 ? (
        <div className="relative h-[40vh] min-h-[300px] w-full bg-slate-900 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={page.image1}
              alt={page.title}
              className="h-full w-full object-cover opacity-60 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight drop-shadow-md">
              {page.title}
            </h1>
            {page.subTitle && (
              <p className="text-lg md:text-xl text-slate-200 max-w-2xl drop-shadow">
                {page.subTitle}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative py-16 md:py-24 border-b border-border bg-gradient-to-b from-muted/50 to-background overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-0"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-tr-full -z-0"></div>
          
          <Container className="relative z-10 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">{page.title}</h1>
            {page.subTitle && (
              <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto font-medium">
                {page.subTitle}
              </p>
            )}
          </Container>
        </div>
      )}
      
      <Container className="py-12">
        {/* Render Rich Text Content 1 */}
        {page.content && (
          <div 
            className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-display mb-12"
            dangerouslySetInnerHTML={{ __html: applySeoTemplate(page.content, {
              city_name: city?.cityName || "your city",
              page_title: page.title || ""
            }) }}
          />
        )}

        {/* Secondary Image */}
        {page.image2 && (
          <div className="my-12 rounded-xl overflow-hidden border bg-card shadow-sm">
            <img src={page.image2} alt={`${page.title} details`} className="w-full h-auto object-cover max-h-[500px]" />
          </div>
        )}

        {/* Render Rich Text Content 2 */}
        {page.content2 && (
          <div 
            className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-display mt-12"
            dangerouslySetInnerHTML={{ __html: applySeoTemplate(page.content2, {
              city_name: city?.cityName || "your city",
              page_title: page.title || ""
            }) }}
          />
        )}
      </Container>
    </div>
  );
}
