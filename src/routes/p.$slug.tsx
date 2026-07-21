import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cmsService } from "@/services/cms.service";
import { Container } from "@/components/layout/Container";
import { Spinner } from "@/components/feedback/Spinner";
import { APP } from "@/constants/app";

export const Route = createFileRoute("/p/$slug")({
  component: CmsPageRender,
  loader: async ({ params: { slug } }) => {
    try {
      const page = await cmsService.getPageBySlug(slug);
      return { page };
    } catch (e) {
      // In a real SSR app, we'd throw a 404 here
      return { page: null };
    }
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    if (!page) {
      return {
        meta: [{ title: `Page Not Found — ${APP.name}` }],
      };
    }
    
    return {
      meta: [
        { title: page.seo?.metaTitle || `${page.title} — ${APP.name}` },
        { name: "description", content: page.seo?.metaDescription || page.title },
      ],
    };
  },
});

function CmsPageRender() {
  const { slug } = Route.useParams();
  
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
        <div className="bg-slate-900 py-16 text-center">
          <Container>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{page.title}</h1>
            {page.subTitle && (
              <p className="text-lg md:text-xl text-slate-300 mt-4 max-w-3xl mx-auto">
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
            dangerouslySetInnerHTML={{ __html: page.content }}
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
            dangerouslySetInnerHTML={{ __html: page.content2 }}
          />
        )}
      </Container>
    </div>
  );
}
