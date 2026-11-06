import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { blogsService } from "@/services/blogs.service";
import { productsService } from "@/services/products.service";
import { blogsListQuery } from "@/queries";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
        { name: "keywords", content: blog.metaKeywords || blog.tags?.join(", ") || "" },
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

    const modified = blog.content.replace(/<h([23])(.*?)>(.*?)<\/h\1>/gi, (_match, level, attrs, innerText) => {
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
            {blog.tags && blog.tags.length > 0 && (
              <div className="pt-6 border-t flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Related Topics:</span>
                {blog.tags.map((tag) => (
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

            {/* Embedded Catalog Products CTA */}
            {blog.relatedProducts && blog.relatedProducts.length > 0 && (
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
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
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

