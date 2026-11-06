import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { blogsListQuery, blogCategoriesQuery, featuredBlogsQuery, pageSeoQuery } from "@/queries";
import { useLocationStore } from "@/store/useLocationStore";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/feedback/Spinner";
import { buildPageHead } from "@/lib/seo";
import { APP } from "@/constants/app";
import {
  Search,
  Clock,
  Calendar,
  ArrowRight,
  BookOpen,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  Home,
  X,
  Share2,
} from "lucide-react";
import { cn, applyBlogVariables, toSlug } from "@/lib/utils";

export const Route = createFileRoute("/blog/")({
  loader: async ({ context }) => {
    let pageSeo = null;
    try {
      pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/blog"));
    } catch {
      pageSeo = null;
    }
    if (!pageSeo) {
      try {
        pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("/blog/"));
      } catch {
        pageSeo = null;
      }
    }
    if (!pageSeo) {
      try {
        pageSeo = await context.queryClient.fetchQuery(pageSeoQuery("blog"));
      } catch {
        pageSeo = null;
      }
    }
    return { pageSeo };
  },
  head: ({ loaderData }) =>
    buildPageHead(loaderData?.pageSeo?.seo, {
      title: `Battery Guides, Buying Tips & Expert Advice — ${APP.name}`,
      description:
        "Explore the Battery Mantra blog for battery buying guides, seasonal maintenance tips, inverter comparisons, and expert automotive power advice.",
      path: "/blog",
    }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const { city } = useLocationStore();
  const activeCityName = city?.cityName || "Delhi NCR";
  const currentYear = new Date().getFullYear().toString();

  const { data: categoriesData } = useQuery(blogCategoriesQuery());
  const { data: featuredData } = useQuery(featuredBlogsQuery());
  const { data: blogsData, isLoading } = useQuery(
    blogsListQuery({
      category: selectedCategory === "ALL" ? undefined : selectedCategory,
      search: search.trim() || undefined,
      size: 30,
    })
  );

  const posts = blogsData?.content || [];
  const featuredPost = featuredData?.[0] || posts.find((p) => p.isFeatured);

  const featuredTitle = featuredPost
    ? applyBlogVariables(featuredPost.title, {
        cityName: activeCityName,
        categoryName: featuredPost.category,
        year: currentYear,
      })
    : "";

  const featuredExcerpt = featuredPost
    ? applyBlogVariables(featuredPost.excerpt, {
        cityName: activeCityName,
        categoryName: featuredPost.category,
        year: currentYear,
      })
    : "";

  const featuredSlug = featuredPost
    ? featuredPost.slug?.includes("{city_name}")
      ? featuredPost.slug.replace(/\{city_name\}/g, toSlug(activeCityName))
      : featuredPost.slug
    : "";

  // Remaining posts excluding hero featured post if it's already shown
  const remainingPosts = useMemo(() => {
    if (search || selectedCategory !== "ALL" || !featuredPost) {
      return posts;
    }
    return posts.filter((p) => p.id !== featuredPost.id);
  }, [posts, featuredPost, search, selectedCategory]);

  return (
    <div className="min-h-screen bg-surface/30 pb-16">
      {/* Breadcrumb Bar */}
      <div className="border-b bg-background">
        <Container size="xl" className="py-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="font-medium text-foreground">Blog</span>
          </nav>
        </Container>
      </div>

      {/* Hero Header */}
      <section className="border-b bg-gradient-to-b from-primary/5 via-background to-background py-10 sm:py-14">
        <Container size="xl" className="space-y-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              <span>The Power Journal</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Battery Guides, Comparisons & Maintenance Tips
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Everything you need to know about automotive batteries, home inverter setups, and lithium storage solutions.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search guides (e.g. summer maintenance, tubular vs lithium, Amaron)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-10 pr-9 text-sm rounded-xl bg-background border-border shadow-sm focus-visible:ring-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </Container>
      </section>

      <Container size="xl" className="pt-8 space-y-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all",
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All Articles
          </button>
          {categoriesData?.map((cat) => (
            <button
              key={cat.category}
              type="button"
              onClick={() => setSelectedCategory(cat.category)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5",
                selectedCategory === cat.category
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{cat.category}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  selectedCategory === cat.category
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {cat.postCount}
              </span>
            </button>
          ))}
        </div>

        {/* Featured Post Card (Hero Highlight) */}
        {!search && selectedCategory === "ALL" && featuredPost && (
          <Link
            to="/blog/$slug"
            params={{ slug: featuredSlug }}
            className="group relative block overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl hover:border-primary/40"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden bg-muted">
                {featuredPost.coverImage ? (
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredTitle}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                    <BookOpen className="h-12 w-12 opacity-30" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-primary-foreground shadow-sm flex items-center gap-1 font-semibold text-xs px-2.5 py-1">
                    <Sparkles className="h-3 w-3" /> Featured Story
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-medium">
                      {featuredPost.category}
                    </Badge>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {featuredPost.readTimeMinutes} min read
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {featuredTitle}
                  </h2>

                  <p className="text-muted-foreground text-sm sm:text-base line-clamp-3">
                    {featuredExcerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <div className="flex items-center gap-2.5">
                    {featuredPost.authorImage ? (
                      <img
                        src={featuredPost.authorImage}
                        alt={featuredPost.authorName || "Author"}
                        className="h-8 w-8 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                        {(featuredPost.authorName || "BM")[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {featuredPost.authorName || "Battery Mantra"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {featuredPost.publishedAt
                          ? new Date(featuredPost.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recently Published"}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                    Read article <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading guides...</p>
          </div>
        ) : remainingPosts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-16 px-4 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/60 mb-3" />
            <h3 className="font-display text-lg font-semibold">No articles found</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              We couldn't find any articles matching your search or filter. Try clearing filters to see all guides.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedCategory("ALL");
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          /* Articles Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {remainingPosts.map((post) => {
              const postTitle = applyBlogVariables(post.title, {
                cityName: activeCityName,
                categoryName: post.category,
                year: currentYear,
              });
              const postExcerpt = applyBlogVariables(post.excerpt, {
                cityName: activeCityName,
                categoryName: post.category,
                year: currentYear,
              });
              const postSlug = post.slug?.includes("{city_name}")
                ? post.slug.replace(/\{city_name\}/g, toSlug(activeCityName))
                : post.slug;

              return (
                <article
                  key={post.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/40"
                >
                  {/* Thumbnail */}
                  <Link
                    to="/blog/$slug"
                    params={{ slug: postSlug }}
                    className="relative aspect-[16/10] overflow-hidden bg-muted"
                  >
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={postTitle}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                        <BookOpen className="h-8 w-8 opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs font-medium">
                        {post.category}
                      </Badge>
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Published"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTimeMinutes} min read
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold tracking-tight text-foreground line-clamp-2 transition-colors group-hover:text-primary">
                        <Link to="/blog/$slug" params={{ slug: postSlug }}>
                          {postTitle}
                        </Link>
                      </h3>

                      {postExcerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {postExcerpt}
                        </p>
                      )}
                    </div>

                    {/* Footer / CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground font-medium">
                        {post.authorName || "Battery Mantra"}
                      </span>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: postSlug }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform"
                      >
                        Read <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Doorstep Service CTA Banner */}
        <section className="mt-12 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 p-6 sm:p-10 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% Genuine Batteries & Doorstep Service
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                Car Battery Dead or Inverter Down?
              </h3>
              <p className="text-white/90 text-sm max-w-xl">
                Get lightning-fast 1-2 hour doorstep delivery & free expert installation across Delhi NCR.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Button asChild size="lg" className="bg-white text-red-600 hover:bg-white/90 shadow font-semibold">
                <Link to="/vehicle-finder">Find Compatible Battery</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                <a href="tel:+919876543210" className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> Call Helpline
                </a>
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}

