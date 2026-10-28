import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const BASE_URL = "https://batterymantra.com";
const API_BASE = process.env.API_BASE_URL || "https://200.97.165.54.nip.io/api";

// Allow self-signed or internal IP certs if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const toSlug = (text) =>
  text
    ? text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    : "";

const today = new Date().toISOString().split("T")[0];

function generateUrlXml(loc, lastmod = today, changefreq = "weekly", priority = "0.8") {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function wrapUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

function wrapSitemapIndex(sitemaps) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (url) => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}

async function fetchJson(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[Sitemap] Warning: Failed to fetch ${endpoint}:`, err.message);
    return null;
  }
}

async function run() {
  console.log(`[Sitemap] Starting sitemap generation for ${BASE_URL}...`);

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // 1. Static Pages
  const staticUrls = [
    generateUrlXml(`${BASE_URL}`, today, "daily", "1.0"),
    generateUrlXml(`${BASE_URL}/contact-us`, today, "monthly", "0.7"),
    generateUrlXml(`${BASE_URL}/categories`, today, "weekly", "0.9"),
    generateUrlXml(`${BASE_URL}/shop-by-manufacturers`, today, "weekly", "0.9"),
    generateUrlXml(`${BASE_URL}/vehicle-finder`, today, "monthly", "0.8"),
    generateUrlXml(`${BASE_URL}/about-us`, today, "monthly", "0.6"),
    generateUrlXml(`${BASE_URL}/privacy-policy`, today, "yearly", "0.4"),
    generateUrlXml(`${BASE_URL}/terms-and-conditions`, today, "yearly", "0.4"),
    generateUrlXml(`${BASE_URL}/refund-policy`, today, "yearly", "0.4"),
    generateUrlXml(`${BASE_URL}/shipping-policy`, today, "yearly", "0.4"),
  ];
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap-static.xml"), wrapUrlset(staticUrls), "utf8");
  console.log(`[Sitemap] Created sitemap-static.xml (${staticUrls.length} URLs)`);

  // 2. Categories
  const categoriesData = await fetchJson("/categories");
  const categoryUrls = [];
  if (Array.isArray(categoriesData)) {
    for (const cat of categoriesData) {
      const catSlug = cat.categorySlug || toSlug(cat.categoryName);
      if (catSlug) {
        categoryUrls.push(generateUrlXml(`${BASE_URL}/shop-by-category/${catSlug}`, today, "weekly", "0.9"));
        categoryUrls.push(generateUrlXml(`${BASE_URL}/brands/${catSlug}`, today, "weekly", "0.8"));
      }
      if (Array.isArray(cat.subCategories)) {
        for (const sub of cat.subCategories) {
          const subSlug = sub.categorySlug || toSlug(sub.categoryName);
          if (subSlug) {
            categoryUrls.push(generateUrlXml(`${BASE_URL}/shop-by-category/${subSlug}`, today, "weekly", "0.8"));
          }
        }
      }
    }
  }
  const uniqueCategoryUrls = Array.from(new Set(categoryUrls));
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap-categories.xml"), wrapUrlset(uniqueCategoryUrls), "utf8");
  console.log(`[Sitemap] Created sitemap-categories.xml (${uniqueCategoryUrls.length} URLs)`);

  // 3. Brands
  const brandsData = await fetchJson("/brands");
  const brandUrls = [];
  if (Array.isArray(brandsData)) {
    for (const brand of brandsData) {
      const brandSlug = brand.slug || toSlug(brand.brandName);
      if (brandSlug) {
        brandUrls.push(generateUrlXml(`${BASE_URL}/brand/${brandSlug}`, today, "weekly", "0.8"));
        brandUrls.push(generateUrlXml(`${BASE_URL}/brand-dealer/${brandSlug}`, today, "weekly", "0.8"));
      }
    }
  }
  const uniqueBrandUrls = Array.from(new Set(brandUrls));
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap-brands.xml"), wrapUrlset(uniqueBrandUrls), "utf8");
  console.log(`[Sitemap] Created sitemap-brands.xml (${uniqueBrandUrls.length} URLs)`);

  // 4. Manufacturers & Models
  const manufacturersData = await fetchJson("/manufacturers");
  const vehiclesData = await fetchJson("/vehicles?size=10000");
  const manufacturerUrls = [];

  const categorySlugMap = new Map();
  if (Array.isArray(categoriesData)) {
    for (const c of categoriesData) {
      categorySlugMap.set(c.categoryId, c.categorySlug || toSlug(c.categoryName));
    }
  }

  if (Array.isArray(manufacturersData)) {
    for (const m of manufacturersData) {
      const makeSlug = toSlug(m.name);
      if (Array.isArray(m.categories)) {
        for (const cat of m.categories) {
          const catSlug = cat.categorySlug || toSlug(cat.categoryName) || "car-batteries";
          manufacturerUrls.push(
            generateUrlXml(`${BASE_URL}/manufacturers/${catSlug}/${makeSlug}`, today, "weekly", "0.8")
          );
        }
      }
    }
  }

  const vehicleList = Array.isArray(vehiclesData) ? vehiclesData : vehiclesData?.content || [];
  for (const v of vehicleList) {
    const catSlug = (v.categoryId && categorySlugMap.get(v.categoryId)) || "car-batteries";
    const makeSlug = toSlug(v.make);
    const modelSlug = v.slug || toSlug(v.model);
    if (makeSlug && modelSlug) {
      manufacturerUrls.push(
        generateUrlXml(
          `${BASE_URL}/manufacturer-products/${catSlug}/${makeSlug}/${modelSlug}`,
          today,
          "weekly",
          "0.8"
        )
      );
    }
  }
  const uniqueManufacturerUrls = Array.from(new Set(manufacturerUrls));
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "sitemap-manufacturers.xml"),
    wrapUrlset(uniqueManufacturerUrls),
    "utf8"
  );
  console.log(`[Sitemap] Created sitemap-manufacturers.xml (${uniqueManufacturerUrls.length} URLs)`);

  // 5. Products
  const productsData = await fetchJson("/products?size=10000");
  const productList = Array.isArray(productsData) ? productsData : productsData?.content || [];
  const productUrls = [];

  for (const p of productList) {
    const slug = p.seo?.slug || toSlug(p.productName);
    if (slug) {
      productUrls.push(generateUrlXml(`${BASE_URL}/product/${slug}`, today, "weekly", "0.9"));
    }
  }
  const uniqueProductUrls = Array.from(new Set(productUrls));
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap-products.xml"), wrapUrlset(uniqueProductUrls), "utf8");
  console.log(`[Sitemap] Created sitemap-products.xml (${uniqueProductUrls.length} URLs)`);

  // 6. Master Sitemap Index
  const masterIndexXml = wrapSitemapIndex([
    `${BASE_URL}/sitemap-static.xml`,
    `${BASE_URL}/sitemap-categories.xml`,
    `${BASE_URL}/sitemap-brands.xml`,
    `${BASE_URL}/sitemap-manufacturers.xml`,
    `${BASE_URL}/sitemap-products.xml`,
  ]);
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), masterIndexXml, "utf8");
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap_index.xml"), masterIndexXml, "utf8");
  console.log(`[Sitemap] Created master sitemap.xml & sitemap_index.xml index pointing to 5 sub-sitemaps.`);

  const totalUrls =
    staticUrls.length +
    uniqueCategoryUrls.length +
    uniqueBrandUrls.length +
    uniqueManufacturerUrls.length +
    uniqueProductUrls.length;

  console.log(`\n✅ [Sitemap] SUCCESS! Generated total ${totalUrls} indexed URLs across 5 sitemaps.`);
}

run().catch((err) => {
  console.error("[Sitemap] Failed to generate sitemaps:", err);
  process.exit(1);
});
