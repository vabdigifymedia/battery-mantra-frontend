import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { blogsService, normalizeTags } from "@/services/blogs.service";
import { productsService } from "@/services/products.service";
import {
  blogsListQuery,
  categoriesQuery,
  brandsQuery,
  manufacturersListQuery,
  productFilterQuery,
} from "@/queries";
import type { BlogPostDetailResponse } from "@/types/dto";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/feedback/Spinner";
import { ProductCard } from "@/components/products/ProductCard";
import { APP } from "@/constants/app";
import {
  Calendar,
  Clock,
  Eye,
  Share2,
  ChevronRight,
  Home,
  Check,
  Copy,
  BookOpen,
  ArrowRight,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  Truck,
  Package,
  List,
  Car,
  Tag,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { cn, toSlug, getBrandSlug } from "@/lib/utils";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params: { slug } }) => {
    try {
      const blog = await blogsService.bySlug(slug);
      return { blog };
    } catch {
      return { blog: null };
    }
  },
  head: ({ loaderData, params }) => {
    const blog = loaderData?.blog;
    if (!blog) {
      return {
        meta: [{ title: `Blog Post Not Found — ${APP.name}` }],
      };
    }

    const title = blog.metaTitle || `${blog.title} — ${APP.name}`;
    const description =
      blog.metaDescription || blog.excerpt || `Read ${blog.title} on Battery Mantra.`;
    const image = blog.ogImage || blog.coverImage || "https://batterymantra.com/og-image.jpg";
    const canonical = blog.canonicalUrl || `https://batterymantra.com/blog/${params.slug}`;

    return {
      links: [{ rel: "canonical", href: canonical }],
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: blog.metaKeywords || (Array.isArray(blog.tags) ? blog.tags.join(", ") : blog.tags) || "" },
        // OpenGraph
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: image },
        { property: "article:published_time", content: blog.publishedAt || blog.createdAt },
        { property: "article:section", content: blog.category },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: blog.title,
            description: blog.excerpt,
            image: image,
            author: {
              "@type": "Person",
              name: blog.authorName || "Battery Mantra",
            },
            publisher: {
              "@type": "Organization",
              name: APP.name,
              logo: {
                "@type": "ImageObject",
                url: "https://batterymantra.com/logo.png",
              },
            },
            datePublished: blog.publishedAt || blog.createdAt,
            dateModified: blog.updatedAt || blog.createdAt,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": canonical,
            },
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  const blog = loaderData?.blog;

  // More articles for sidebar
  const { data: moreArticles } = useQuery(
    blogsListQuery({
      size: 4,
    })
  );

  // Parse Headings for Table of Contents
  const { headings, contentWithIds } = useMemo(() => {
    if (!blog?.content) return { headings: [], contentWithIds: "" };

    const parsed: { id: string; text: string; level: number }[] = [];
    let counter = 0;

    const modified = blog.content.replace(/<h([23])(.*?)>(.*?)<\/h\1>/gi, (_match: string, level: string, attrs: string, innerText: string) => {
      const cleanText = innerText.replace(/<[^>]*>/g, "").trim();
      const id = `sec-${counter++}-${cleanText.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      parsed.push({
        id,
        text: cleanText,
        level: parseInt(level, 10),
      });
      return `<h${level}${attrs} id="${id}">${innerText}</h${level}>`;
    });

    return { headings: parsed, contentWithIds: modified };
  }, [blog?.content]);

  // Copy share link handler
  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Article link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!blog) {
    return (
      <Container size="md" className="py-20 text-center space-y-4">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/60" />
        <h1 className="font-display text-2xl font-bold">Article Not Found</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          The guide you are looking for may have been moved, renamed, or is currently in draft mode.
        </p>
        <Button asChild className="mt-2">
          <Link to="/blog">Browse All Guides</Link>
        </Button>
      </Container>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://batterymantra.com/blog/${slug}`;
  const shareText = encodeURIComponent(`${blog.title} — Battery Mantra`);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Breadcrumb Bar */}
      <div className="border-b bg-surface/40">
        <Container size="xl" className="py-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            <Link to="/blog" className="hover:text-foreground transition-colors shrink-0">
              Blog
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            <span className="font-medium text-foreground truncate">{blog.title}</span>
          </nav>
        </Container>
      </div>

      <Container size="xl" className="pt-8">
        {/* Article Header */}
        <header className="max-w-4xl mx-auto space-y-5 text-center">
          <div className="inline-flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-semibold text-xs">
              {blog.category}
            </Badge>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              {blog.excerpt}
            </p>
          )}

          {/* Meta details bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              {blog.authorImage ? (
                <img
                  src={blog.authorImage}
                  alt={blog.authorName || "Author"}
                  className="h-7 w-7 rounded-full object-cover border"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                  {(blog.authorName || "BM")[0]}
                </div>
              )}
              <span className="font-medium text-foreground">{blog.authorName || "Battery Mantra"}</span>
            </div>

            <span>•</span>

            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {blog.publishedAt
                ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Recently Published"}
            </span>

            <span>•</span>

            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {blog.readTimeMinutes} min read
            </span>

            {blog.viewCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {blog.viewCount.toLocaleString()} views
                </span>
              </>
            )}
          </div>
        </header>

        {/* Hero Cover Image */}
        {blog.coverImage && (
          <div className="max-w-5xl mx-auto mt-8 overflow-hidden rounded-2xl border bg-muted shadow-sm aspect-[16/9] max-h-[500px]">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content Layout: 2 Columns (Article body + Sticky Sidebar) */}
        <div className="mt-12 grid gap-12 lg:grid-cols-12 max-w-6xl mx-auto">
          {/* Main Article Body (8 Cols) */}
          <main className="lg:col-span-8 space-y-10">
            {/* Table of Contents */}
            {headings.length > 2 && (
              <div className="rounded-2xl border bg-surface/50 p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <List className="h-4 w-4 text-primary" /> Table of Contents
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  {headings.map((h) => (
                    <li
                      key={h.id}
                      className={cn(
                        "hover:text-primary transition-colors",
                        h.level === 3 ? "pl-4" : "font-medium text-foreground/90"
                      )}
                    >
                      <a href={`#${h.id}`} className="hover:underline">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formatted Article Content */}
            <article
              className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-img:border"
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />

            {/* Tags Row */}
            {normalizeTags(blog.tags).length > 0 && (
              <div className="pt-6 border-t flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Related Topics:</span>
                {normalizeTags(blog.tags).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Social Share Bar */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-sm font-semibold">Found this guide helpful?</p>
                <p className="text-xs text-muted-foreground">Share it with friends or family looking for battery advice.</p>
              </div>

              <div className="flex items-center gap-2">
                {/* WhatsApp */}
                <Button asChild size="sm" variant="outline" className="h-9 px-3 hover:bg-emerald-500/10 hover:text-emerald-600">
                  <a
                    href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Share on WhatsApp"
                  >
                    WhatsApp
                  </a>
                </Button>

                {/* Twitter / X */}
                <Button asChild size="sm" variant="outline" className="h-9 px-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Share on X"
                  >
                    X (Twitter)
                  </a>
                </Button>

                {/* Copy Link */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-9 px-3 flex items-center gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy Link"}</span>
                </Button>
              </div>
            </div>

            {/* Dynamic Recommendations / Conversion CTA */}
            <BlogRecommendationSection blog={blog} />
          </main>

          {/* Sticky Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Quick Vehicle Battery Finder Widget */}
            <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 space-y-4 shadow-sm">
              <div className="space-y-1.5">
                <Badge className="bg-primary text-primary-foreground text-[10px]">Instant Fitment</Badge>
                <h4 className="font-display text-lg font-bold">Find Your Car's Battery</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select your vehicle make, model, and fuel type to see 100% compatible batteries with best exchange rates.
                </p>
              </div>
              <Button asChild className="w-full font-semibold">
                <Link to="/vehicle-finder">
                  Launch Vehicle Finder <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Doorstep Trust Highlights */}
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                The Battery Mantra Guarantee
              </h4>
              <ul className="space-y-3 text-xs text-foreground">
                <li className="flex items-start gap-2.5">
                  <Truck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">1-2 Hour Doorstep Delivery</span>
                    <span className="text-muted-foreground">Express delivery by verified technicians.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">100% Genuine with Brand Warranty</span>
                    <span className="text-muted-foreground">Official manufacturer bill and warranty card.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <PhoneCall className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Free Old Battery Pickup</span>
                    <span className="text-muted-foreground">Highest scrap rebate credited on the spot.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* More Articles */}
            {moreArticles?.content && moreArticles.content.length > 0 && (
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Articles
                </h4>
                <div className="space-y-3">
                  {moreArticles.content
                    .filter((p) => p.slug !== slug)
                    .slice(0, 3)
                    .map((item) => (
                      <Link
                        key={item.id}
                        to="/blog/$slug"
                        params={{ slug: item.slug }}
                        className="group flex gap-3 items-start hover:opacity-80 transition-opacity"
                      >
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="h-14 w-18 shrink-0 rounded-lg object-cover border bg-muted"
                          />
                        ) : (
                          <div className="h-14 w-18 shrink-0 rounded-lg border bg-muted flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {item.readTimeMinutes} min read
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link to="/blog">View All Guides</Link>
                </Button>
              </div>
            )}
          </aside>
        </div>
      </Container>
    </div>
  );
}

function BlogRecommendationSection({ blog }: { blog: BlogPostDetailResponse }) {
  const recType =
    blog.recommendationType ||
    (blog.relatedCategoryId
      ? "CATEGORY"
      : blog.relatedBrandId
      ? "BRAND"
      : blog.relatedManufacturerId
      ? "MANUFACTURER"
      : blog.relatedProducts && blog.relatedProducts.length > 0
      ? "PRODUCTS"
      : "NONE");

  // Category queries & data
  const { data: allCategories } = useQuery({
    ...categoriesQuery(),
    enabled: recType === "CATEGORY",
  });

  const targetCategory = useMemo(() => {
    if (!allCategories) return null;
    return allCategories.find(
      (c) =>
        (c.categoryId || (c as any).id) === blog.relatedCategoryId ||
        c.categorySlug === blog.relatedCategorySlug
    );
  }, [allCategories, blog.relatedCategoryId, blog.relatedCategorySlug]);

  const categorySlug =
    blog.relatedCategorySlug ||
    targetCategory?.categorySlug ||
    toSlug(targetCategory?.categoryName || blog.relatedCategoryName || "");

  const categoryName =
    targetCategory?.categoryName || blog.relatedCategoryName || "Batteries";

  const shouldFetchCategoryProducts =
    recType === "CATEGORY" &&
    Boolean(blog.relatedCategoryId) &&
    (!blog.relatedProducts || blog.relatedProducts.length === 0);

  const { data: categoryProductsData } = useQuery({
    ...productFilterQuery({
      categoryId: blog.relatedCategoryId ? [blog.relatedCategoryId] : [],
      size: 4,
    }),
    enabled: shouldFetchCategoryProducts,
  });

  const categoryProducts =
    blog.relatedProducts && blog.relatedProducts.length > 0
      ? blog.relatedProducts
      : categoryProductsData?.content || [];

  // Brand queries & data
  const { data: allBrands } = useQuery({
    ...brandsQuery(),
    enabled: recType === "BRAND",
  });

  const targetBrand = useMemo(() => {
    if (!allBrands) return null;
    return allBrands.find(
      (b) =>
        (b.brandId || (b as any).id) === blog.relatedBrandId ||
        getBrandSlug(b) === blog.relatedBrandSlug
    );
  }, [allBrands, blog.relatedBrandId, blog.relatedBrandSlug]);

  const brandSlug =
    blog.relatedBrandSlug ||
    (targetBrand ? getBrandSlug(targetBrand) : "") ||
    toSlug(targetBrand?.brandName || blog.relatedBrandName || "");

  const brandName = targetBrand?.brandName || blog.relatedBrandName || "Brand";
  const brandLogo = targetBrand?.brandLogo;

  const shouldFetchBrandProducts =
    recType === "BRAND" &&
    Boolean(blog.relatedBrandId) &&
    (!blog.relatedProducts || blog.relatedProducts.length === 0);

  const { data: brandProductsData } = useQuery({
    ...productFilterQuery({
      brandId: blog.relatedBrandId ? [blog.relatedBrandId] : [],
      size: 4,
    }),
    enabled: shouldFetchBrandProducts,
  });

  const brandProducts =
    blog.relatedProducts && blog.relatedProducts.length > 0
      ? blog.relatedProducts
      : brandProductsData?.content || [];

  // Manufacturer queries & data
  const { data: allManufacturers } = useQuery({
    ...manufacturersListQuery(),
    enabled: recType === "MANUFACTURER",
  });

  const targetManufacturer = useMemo(() => {
    if (!allManufacturers) return null;
    return allManufacturers.find(
      (m) => m.id === blog.relatedManufacturerId
    );
  }, [allManufacturers, blog.relatedManufacturerId]);

  const manufacturerName =
    targetManufacturer?.name || blog.relatedManufacturerName || "Vehicle";
  const manufacturerLogo = targetManufacturer?.logoUrl;
  const manufacturerSlug = toSlug(manufacturerName);

  if (recType === "NONE") {
    return null;
  }

  if (recType === "CATEGORY") {
    return (
      <section className="space-y-6 pt-8 border-t">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold">
                Featured Category Showcase
              </Badge>
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Looking for {categoryName}?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Explore our full collection of 100% genuine {categoryName.toLowerCase()} with official brand warranty, instant old battery scrap rebate, and 1-2 hour doorstep delivery & installation in Delhi NCR.
              </p>
            </div>
            {categorySlug && (
              <Button asChild size="lg" className="shrink-0 font-semibold shadow-md">
                <Link to="/shop/c/$categorySlug" params={{ categorySlug }}>
                  Browse All {categoryName}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {categoryProducts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                Top Rated {categoryName}
              </h4>
              {categorySlug && (
                <Link
                  to="/shop/c/$categorySlug"
                  params={{ categorySlug }}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {categoryProducts.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  if (recType === "BRAND") {
    return (
      <section className="space-y-6 pt-8 border-t">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-red-500/10 via-amber-500/5 to-card p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-3">
                {brandLogo ? (
                  <div className="bg-white p-2 rounded-lg border shadow-xs">
                    <img
                      src={brandLogo}
                      alt={brandName}
                      className="h-7 w-auto max-w-[100px] object-contain"
                    />
                  </div>
                ) : (
                  <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30">
                    <Tag className="mr-1 h-3 w-3" /> Brand Partner
                  </Badge>
                )}
                <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 text-xs font-semibold">
                  Official Authorized Dealer
                </Badge>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Buy 100% Genuine {brandName} Batteries Online
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Authorized dealer for {brandName}. Every battery comes direct from manufacturer stock with paper warranty card, digital bill, and certified installation by trained experts.
              </p>
            </div>

            {brandSlug && (
              <Button asChild size="lg" className="shrink-0 font-semibold shadow-md bg-red-600 hover:bg-red-700 text-white">
                <Link to="/brand/$brandSlug" params={{ brandSlug }}>
                  Shop {brandName} Store
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {brandProducts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                Bestselling {brandName} Batteries
              </h4>
              {brandSlug && (
                <Link
                  to="/brand/$brandSlug"
                  params={{ brandSlug }}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View all {brandName} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {brandProducts.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  if (recType === "MANUFACTURER") {
    return (
      <section className="space-y-6 pt-8 border-t">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-card p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-3">
                {manufacturerLogo ? (
                  <div className="bg-white p-2 rounded-lg border shadow-xs">
                    <img
                      src={manufacturerLogo}
                      alt={manufacturerName}
                      className="h-7 w-auto max-w-[100px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                    <Car className="h-5 w-5" />
                  </div>
                )}
                <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs font-semibold">
                  Vehicle Fitment Center
                </Badge>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Find Compatible Batteries for {manufacturerName}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Select your {manufacturerName} car model to view exact battery specifications, Ah capacity ratings, terminal layouts, and guaranteed best prices with old battery exchange rebate.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 shrink-0">
              {manufacturerSlug ? (
                <Button asChild size="lg" className="font-semibold shadow-md bg-blue-600 hover:bg-blue-700 text-white">
                  <Link
                    to="/manufacturers/$categorySlug/$slug"
                    params={{
                      categorySlug: "car-battery",
                      slug: manufacturerSlug,
                    }}
                  >
                    Find {manufacturerName} Batteries
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="lg" className="font-medium">
                <Link to="/vehicle-finder">
                  Vehicle Finder
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {blog.relatedProducts && blog.relatedProducts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Recommended Batteries for {manufacturerName} Models
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {blog.relatedProducts.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  // DEFAULT / PRODUCTS: Handpicked individual products
  if (blog.relatedProducts && blog.relatedProducts.length > 0) {
    return (
      <section className="space-y-4 pt-6 border-t">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Recommended Solutions
          </span>
          <h3 className="font-display text-2xl font-bold tracking-tight">
            Featured Batteries Mentioned in This Guide
          </h3>
          <p className="text-xs text-muted-foreground">
            Available with free doorstep delivery and professional technician installation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {blog.relatedProducts.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      </section>
    );
  }

  return null;
}

