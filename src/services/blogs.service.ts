import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { generateCandidateSlugs } from "@/lib/utils";
import type {
  BlogPostDetailResponse,
  BlogPostListResponse,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  BlogCategoryCountResponse,
  PageBlogPostListResponse,
  BlogFilterParams,
  BlogStatus,
} from "@/types/dto";

// Sample mock data for fallback when backend API is not yet active
const MOCK_BLOGS: BlogPostDetailResponse[] = [
  {
    id: "blog-1",
    title: "How to Choose the Best Car Battery for Extreme Indian Summers",
    slug: "choose-best-car-battery-indian-summers",
    excerpt: "Summer heat is the #1 killer of car batteries in India. Discover how high ambient temperatures accelerate battery degradation and which high-CCA batteries survive harsh Delhi-NCR heatwaves.",
    coverImage: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1200&q=80",
    category: "Car Batteries",
    tags: ["Car Battery", "Summer Maintenance", "Amaron", "Exide"],
    authorName: "Ankur Sharma",
    authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    readTimeMinutes: 5,
    status: "PUBLISHED",
    isFeatured: true,
    viewCount: 1420,
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    metaTitle: "Best Car Batteries for Indian Summers | Battery Mantra Guide",
    metaDescription: "Learn how summer temperatures affect car batteries and how to choose the right battery with high cold cranking amps and heat-resistant alloy plates.",
    metaKeywords: "car battery summer, amaron vs exide, car battery maintenance, battery mantra",
    content: `
      <h2>Why Indian Summers Drain Batteries Faster Than Winters</h2>
      <p>While cold winter mornings often reveal a weak battery, it is actually the scorching summer heat that causes the damage in the first place. Temperatures under the vehicle hood can easily surpass 60°C during peak Delhi and Gurgaon afternoons.</p>
      
      <h3>Key Damage Mechanisms in Extreme Heat</h3>
      <ul>
        <li><strong>Electrolyte Evaporation:</strong> In conventional flooded lead-acid batteries, high temperatures cause the water in the electrolyte solution to evaporate, exposing internal lead plates.</li>
        <li><strong>Accelerated Grid Corrosion:</strong> For every 10°C increase above room temperature, internal chemical activity doubles, speeding up plate corrosion.</li>
        <li><strong>Internal Self-Discharge:</strong> Batteries discharge up to 3x faster when stored or parked in hot environments.</li>
      </ul>

      <h2>What to Look for When Buying a New Battery</h2>
      <p>When replacing your car battery for Indian climates, prioritize:</p>
      <ol>
        <li><strong>Silver-Alloy or Calcium-Calcium Grids:</strong> Modern premium batteries like Amaron Pro or Exide Matrix use silver alloys that withstand corrosion and minimize water loss.</li>
        <li><strong>Higher Reserve Capacity (RC):</strong> Ensures sustained power for modern infotainment systems, dashcams, and climate control electronics.</li>
        <li><strong>Zero Maintenance Sealed Design:</strong> Completely sealed factory-charged units require zero topping up and eliminate acid spill risks.</li>
      </ol>

      <h2>Pro Maintenance Tips from Battery Mantra Engineers</h2>
      <p>Inspect terminal clamps for white sulfate powdery deposits. Clean them with warm water and baking soda, then apply petroleum jelly. If your starter motor cranks sluggishly for more than 2 seconds, test your battery voltage immediately using our free doorstep diagnostic service.</p>
    `,
  },
  {
    id: "blog-2",
    title: "Tubular vs Flat Plate vs Lithium Inverter Batteries: The Complete 2026 Comparison",
    slug: "tubular-vs-flat-plate-vs-lithium-inverter-batteries",
    excerpt: "Confused between Tall Tubular, Short Tubular, and modern Wall-Mounted Lithium Inverter batteries? Here is an engineering breakdown of lifespan, efficiency, and real-world costs.",
    coverImage: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?w=1200&q=80",
    category: "Inverter Batteries",
    tags: ["Inverter", "Home Power", "Lithium Battery", "Luminous"],
    authorName: "Battery Mantra Technical Team",
    authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    readTimeMinutes: 7,
    status: "PUBLISHED",
    isFeatured: false,
    viewCount: 980,
    publishedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    metaTitle: "Tubular vs Lithium Inverter Battery Comparison | Battery Mantra",
    metaDescription: "Detailed comparison of Tubular, Flat Plate, and Lithium Inverter batteries covering lifespan, cycle life, warranty, and pricing in India.",
    metaKeywords: "tubular battery vs lithium, inverter battery guide, best inverter battery for home",
    content: `
      <h2>The Shift in Home Backup Power Solutions</h2>
      <p>For decades, lead-acid tubular batteries have ruled Indian households. However, with the emergence of integrated Lithium Iron Phosphate (LiFePO4) solar-ready wall units, homeowners now face a crucial decision when replacing their backup systems.</p>

      <h3>1. Tall Tubular Batteries (The Traditional Workhorse)</h3>
      <p>Tall tubular batteries feature tall cylindrical positive tubes filled with active lead material. They are designed for frequent and deep discharge cycles common during long summer power cuts.</p>
      <ul>
        <li><strong>Lifespan:</strong> 4 to 6 years with diligent distilled water top-ups.</li>
        <li><strong>Warranty:</strong> Typically 36 to 66 months.</li>
        <li><strong>Pros:</strong> High surge capacity, proven reliability, economical upfront investment.</li>
        <li><strong>Cons:</strong> Heavy (55-65 kg), emits acidic fumes during charging, requires periodic maintenance.</li>
      </ul>

      <h3>2. Wall-Mounted Lithium Inverters (The Modern Standard)</h3>
      <p>Lithium LiFePO4 batteries offer 3x higher energy density in a sleek, wall-mountable form factor with integrated smart BMS (Battery Management System).</p>
      <ul>
        <li><strong>Lifespan:</strong> 10 to 12+ years (over 3,500 charging cycles).</li>
        <li><strong>Fast Charging:</strong> Charges from 0 to 100% in just 2-3 hours vs 8-10 hours for lead-acid.</li>
        <li><strong>Zero Maintenance:</strong> Completely sealed with zero toxic gas emission, making it safe for indoor apartments.</li>
      </ul>
    `,
  },
  {
    id: "blog-3",
    title: "5 Tell-tale Signs Your Car Battery Is About to Die (Don't Get Stranded!)",
    slug: "5-signs-car-battery-about-to-die",
    excerpt: "Is your car struggling to start in the morning? Learn the 5 subtle early warnings before your battery leaves you stranded in a parking lot or traffic jam.",
    coverImage: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1200&q=80",
    category: "Maintenance Guides",
    tags: ["Tips", "Emergency", "Doorstep Replacement"],
    authorName: "Ankur Sharma",
    authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    readTimeMinutes: 4,
    status: "PUBLISHED",
    isFeatured: false,
    viewCount: 2310,
    publishedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    metaTitle: "5 Signs Your Car Battery is Dying | Battery Mantra",
    metaDescription: "Recognize early car battery failure signs: slow engine crank, dim headlights, clicking noise, and dashboard warning lights.",
    metaKeywords: "car battery dying signs, jump start car, battery replacement doorstep",
    content: `
      <h2>Don't Wait for the Dreaded Rapid Clicking Sound</h2>
      <p>Most drivers only think about their vehicle battery when turning the key produces a hollow click and silence. Fortunately, batteries rarely die without giving subtle distress signals first.</p>

      <h3>1. Slow Engine Crank (The 'Ruh-Ruh-Ruh' Sound)</h3>
      <p>When starting your engine, it sounds sluggish, taking extra revolutions before catching. This indicates insufficient cranking amperage delivered to the starter motor.</p>

      <h3>2. Dim Headlights and Power Window Sluggishness</h3>
      <p>If your headlights brighten noticeably when you press the accelerator, or power windows crawl up slowly when the engine is idling, the alternator is struggling to compensate for a dying battery.</p>

      <h3>3. Pungent Rotten Egg Odor</h3>
      <p>A sulfuric rotten egg smell indicates that the battery has overheated or internally shorted, venting hazardous hydrogen sulfide gas. Shut off the vehicle and do not drive.</p>

      <h3>4. Swollen or Bloated Battery Casing</h3>
      <p>Extreme heat or alternator overcharging can cause battery sides to bow outward. A swollen casing is an immediate safety hazard that requires emergency replacement.</p>

      <h3>5. Battery Age Exceeding 3 Years</h3>
      <p>In Indian driving conditions with heavy stop-and-go traffic and air conditioning use, the average battery lifespan is 36 to 48 months. If your battery is over 3 years old, schedule a preventive health check.</p>
    `,
  },
];

// Helper to calculate reading time
export function calculateReadTime(textOrHtml: string): number {
  const plainText = textOrHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(" ").length : 0;
  return Math.max(1, Math.ceil(wordCount / 200));
}

// Helper to normalize tags whether returned as comma-separated string or array
export function normalizeTags(tags?: string | string[] | null): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// In-memory store for fallback/client modifications when backend is offline
let localBlogs = [...MOCK_BLOGS];

class BlogsService {
  /**
   * Public: List blogs with optional category, search, and pagination
   */
  async list(params?: BlogFilterParams): Promise<PageBlogPostListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== "ALL") searchParams.set("category", params.category);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page !== undefined) searchParams.set("page", String(params.page));
    if (params?.size !== undefined) searchParams.set("size", String(params.size));
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortDir) searchParams.set("sortDir", params.sortDir);

    const qs = searchParams.toString();
    const url = `${endpoints.blogs.list}${qs ? `?${qs}` : ""}`;

    try {
      const data = await apiFetch<PageBlogPostListResponse>(url, { method: "GET", auth: false });
      if (data && Array.isArray(data.content)) {
        return data;
      }
    } catch {
      // Fallback to local data
    }

    // Local in-memory filtering fallback
    let filtered = localBlogs.filter((b) => b.status === "PUBLISHED");
    if (params?.category && params.category !== "ALL") {
      filtered = filtered.filter((b) => b.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          normalizeTags(b.tags).some((t) => t.toLowerCase().includes(q))
      );
    }

    const page = params?.page ?? 0;
    const size = params?.size ?? 9;
    const start = page * size;
    const paginated = filtered.slice(start, start + size);

    return {
      content: paginated,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size) || 1,
      size,
      number: page,
      first: page === 0,
      last: start + size >= filtered.length,
      empty: filtered.length === 0,
    };
  }

  /**
   * Public: Get blog post by slug with smart multi-candidate resolution
   * (supports city variations like slug-in-noida, slug-noida, slug-in-{city_name}, etc.)
   */
  async bySlug(slug: string): Promise<BlogPostDetailResponse> {
    const candidates = generateCandidateSlugs(slug);

    for (const candidate of candidates) {
      try {
        const data = await apiFetch<BlogPostDetailResponse>(endpoints.blogs.bySlug(candidate), {
          method: "GET",
          auth: false,
        });
        if (data && data.id) {
          return data;
        }
      } catch {
        // Continue to next candidate
      }

      const found = localBlogs.find((b) => b.slug === candidate || b.slug === slug);
      if (found) return found;
    }

    throw new Error(`Blog post not found: ${slug}`);
  }

  /**
   * Public: Get blog categories with count
   */
  async categories(): Promise<BlogCategoryCountResponse[]> {
    try {
      const data = await apiFetch<BlogCategoryCountResponse[]>(endpoints.blogs.categories, {
        method: "GET",
        auth: false,
      });
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }

    const map = new Map<string, number>();
    localBlogs
      .filter((b) => b.status === "PUBLISHED")
      .forEach((b) => {
        map.set(b.category, (map.get(b.category) || 0) + 1);
      });

    return Array.from(map.entries()).map(([category, postCount]) => ({
      category,
      postCount,
    }));
  }

  /**
   * Public: Get featured blogs
   */
  async featured(): Promise<BlogPostListResponse[]> {
    try {
      const data = await apiFetch<BlogPostListResponse[]>(endpoints.blogs.featured, {
        method: "GET",
        auth: false,
      });
      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      // Fallback
    }

    return localBlogs.filter((b) => b.isFeatured && b.status === "PUBLISHED");
  }

  /**
   * Admin: List all blogs with status filter
   */
  async adminList(params?: BlogFilterParams): Promise<PageBlogPostListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.page !== undefined) searchParams.set("page", String(params.page));
    if (params?.size !== undefined) searchParams.set("size", String(params.size));

    const qs = searchParams.toString();
    const url = `${endpoints.admin.blogs.list}${qs ? `?${qs}` : ""}`;

    try {
      const data = await apiFetch<PageBlogPostListResponse>(url, { method: "GET" });
      if (data && Array.isArray(data.content)) {
        return data;
      }
    } catch {
      // Fallback
    }

    let filtered = [...localBlogs];
    if (params?.status) {
      filtered = filtered.filter((b) => b.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const start = page * size;
    const paginated = filtered.slice(start, start + size);

    return {
      content: paginated,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size) || 1,
      size,
      number: page,
      first: page === 0,
      last: start + size >= filtered.length,
      empty: filtered.length === 0,
    };
  }

  /**
   * Admin: Get blog by ID for editing
   */
  async adminGetById(id: string): Promise<BlogPostDetailResponse> {
    try {
      const data = await apiFetch<BlogPostDetailResponse>(endpoints.admin.blogs.byId(id), {
        method: "GET",
      });
      if (data && data.id) {
        return data;
      }
    } catch {
      // Fallback
    }

    const found = localBlogs.find((b) => b.id === id);
    if (found) return found;

    throw new Error(`Blog post not found: ${id}`);
  }

  /**
   * Admin: Create blog post
   */
  async create(data: CreateBlogPostRequest): Promise<BlogPostDetailResponse> {
    try {
      return await apiFetch<BlogPostDetailResponse>(endpoints.admin.blogs.create, {
        method: "POST",
        body: data,
      });
    } catch (err: any) {
      if (
        err?.status === 400 &&
        (err?.message?.includes("Unrecognized") || err?.message?.includes("recommendationType"))
      ) {
        const {
          recommendationType,
          relatedCategoryId,
          relatedCategoryName,
          relatedCategorySlug,
          relatedBrandId,
          relatedBrandName,
          relatedBrandSlug,
          relatedManufacturerId,
          relatedManufacturerName,
          ...corePayload
        } = data;
        return await apiFetch<BlogPostDetailResponse>(endpoints.admin.blogs.create, {
          method: "POST",
          body: corePayload,
        });
      }
      throw err;
    }
  }

  /**
   * Admin: Update blog post
   */
  async update(id: string, data: UpdateBlogPostRequest): Promise<BlogPostDetailResponse> {
    try {
      return await apiFetch<BlogPostDetailResponse>(endpoints.admin.blogs.byId(id), {
        method: "PUT",
        body: data,
      });
    } catch (err: any) {
      if (
        err?.status === 400 &&
        (err?.message?.includes("Unrecognized") || err?.message?.includes("recommendationType"))
      ) {
        const {
          recommendationType,
          relatedCategoryId,
          relatedCategoryName,
          relatedCategorySlug,
          relatedBrandId,
          relatedBrandName,
          relatedBrandSlug,
          relatedManufacturerId,
          relatedManufacturerName,
          ...corePayload
        } = data;
        return await apiFetch<BlogPostDetailResponse>(endpoints.admin.blogs.byId(id), {
          method: "PUT",
          body: corePayload,
        });
      }
      throw err;
    }
  }

  /**
   * Admin: Toggle or change status (PUBLISHED, DRAFT, ARCHIVED)
   */
  async updateStatus(id: string, status: BlogStatus): Promise<BlogPostDetailResponse> {
    return await apiFetch<BlogPostDetailResponse>(endpoints.admin.blogs.updateStatus(id), {
      method: "PATCH",
      body: { status },
    });
  }

  /**
   * Admin: Delete blog post
   */
  async delete(id: string): Promise<void> {
    await apiFetch<void>(endpoints.admin.blogs.delete(id), {
      method: "DELETE",
    });
  }
}

export const blogsService = new BlogsService();

