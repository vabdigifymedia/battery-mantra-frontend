import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Container } from "./Container";
import { APP } from "@/constants/app";

export type FooterGroup = { title: string; links: { label: string; to: string }[] };

const PinterestIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.624 0 12.017 0z"/>
  </svg>
);

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/batterymantra", Icon: Instagram },
  { label: "Twitter", href: "https://twitter.com/batterymantra", Icon: Twitter },
  { label: "Facebook", href: "https://facebook.com/batterymantra", Icon: Facebook },
  { label: "YouTube", href: "https://www.youtube.com/@batterymantra", Icon: Youtube },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/batterymantra/", Icon: Linkedin },
  { label: "Pinterest", href: "https://www.pinterest.com/batterymantra/", Icon: PinterestIcon },
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
                  target="_blank"
                  rel="noreferrer"
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
