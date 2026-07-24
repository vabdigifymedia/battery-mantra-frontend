import { Truck, ShieldCheck, ThumbsUp, CreditCard } from "lucide-react";
import { Container } from "./Container";

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    subtitle: "Free standard installation",
  },
  {
    icon: ShieldCheck,
    title: "100% Genuine",
    subtitle: "Buy without any doubt",
  },
  {
    icon: ThumbsUp,
    title: "Lower Price guaranteed",
    subtitle: "Dedicated support",
  },
  {
    icon: CreditCard,
    title: "Easy & Safe Payment",
    subtitle: "100% secure payment",
  },
];

export function FeatureStrip() {
  return (
    <div className="border-t border-border bg-surface mt-auto">
      <Container size="xl" className="py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className={`flex items-center gap-4 ${index !== 0 ? "pt-6 sm:pt-0 sm:pl-6 lg:pl-8 lg:justify-center" : "lg:justify-start"}`}
              >
                <div className="text-primary shrink-0">
                  <Icon className="h-10 w-10 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm leading-tight">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
