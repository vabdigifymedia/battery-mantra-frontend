import { ShieldCheck, Truck, BadgeIndianRupee, Recycle } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Genuine Warranty",
    desc: "Every battery ships with the manufacturer's full warranty cover.",
  },
  {
    icon: Truck,
    title: "Free Installation",
    desc: "Doorstep delivery and free fitment by certified engineers.",
  },
  {
    icon: BadgeIndianRupee,
    title: "Best Price Promise",
    desc: "Transparent pricing with exchange benefits on old batteries.",
  },
  {
    icon: Recycle,
    title: "Eco Recycling",
    desc: "Safe, regulated disposal of your old battery — every time.",
  },
];

export function WhyChooseUs() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="rounded-2xl border border-border bg-card p-5 shadow-product"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>
  );
}
