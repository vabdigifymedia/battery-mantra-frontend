import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Container } from "./Container";
import { APP } from "@/constants/app";

export type FooterGroup = { title: string; links: { label: string; to: string }[] };

const SOCIALS = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "Twitter", href: "#", Icon: Twitter },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "YouTube", href: "#", Icon: Youtube },
];

/**
 * Footer group slots. Pass real groups from layout/config when ready.
 * Empty array renders an info-only footer (no fake links).
 */
export function Footer({ groups = [] }: { groups?: FooterGroup[] }) {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <Container size="xl" className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="min-w-0">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              India&rsquo;s trusted destination for premium automotive, inverter and industrial batteries.
            </p>
            <div className="mt-5 flex items-center gap-1.5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {groups.length > 0 ? (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {groups.map((g) => (
                <div key={g.title} className="min-w-0">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                    {g.title}
                  </h4>
                  <ul className="space-y-2">
                    {g.links.map((l) => (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP.name}. All rights reserved.
          </p>
          <p>Made in India.</p>
        </div>
      </Container>
    </footer>
  );
}
