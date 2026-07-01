import { APP } from "@/constants/app";

type MetaOptions = {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  noIndex?: boolean;
};

type Tag =
  | { title: string }
  | { charSet: string }
  | { name: string; content: string }
  | { property: string; content: string };

/**
 * Builds the meta array for a TanStack route's `head()`.
 * Title template: `<title> — BatteryMantra`.
 */
export function buildMeta(opts: MetaOptions = {}): { meta: Tag[]; links: { rel: string; href: string }[] } {
  const title = opts.title ? `${opts.title} — ${APP.name}` : `${APP.name} — ${APP.tagline}`;
  const description = opts.description ?? APP.tagline;

  const meta: Tag[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: opts.image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (opts.image) {
    meta.push({ property: "og:image", content: opts.image });
    meta.push({ name: "twitter:image", content: opts.image });
  }
  if (opts.noIndex) {
    meta.push({ name: "robots", content: "noindex,nofollow" });
  }

  const links = opts.canonical ? [{ rel: "canonical", href: opts.canonical }] : [];
  return { meta, links };
}
