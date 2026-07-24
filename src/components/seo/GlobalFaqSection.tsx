import { DynamicFaq } from "@/components/seo/DynamicFaq";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Container } from "@/components/layout/Container";
interface GlobalFaqSectionProps {
  pageType?: "UNIVERSAL" | "CATEGORY" | "MANUFACTURER" | "BRAND" | "BRAND_MODEL" | "PRODUCT";
  context?: Record<string, string>;
}

export function GlobalFaqSection({ pageType = "UNIVERSAL", context = {} }: GlobalFaqSectionProps) {
  return (
    <Container size="xl" className="py-12 sm:py-16">
      <section aria-labelledby="faq" className="w-full">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          {/* FAQ Accordion side */}
          <div className="space-y-6 order-2">
            <SectionHeading
              eyebrow="FAQ"
              title={<span id="faq">Questions, answered</span>}
              align="left"
            />
            <DynamicFaq pageType={pageType} context={context} hideHeading />
          </div>

          {/* Image side */}
          <div className="hidden lg:flex justify-center order-1">
            <img
              src="/images/FAQ Side Image.png"
              alt="FAQ"
              className="w-full max-w-md xl:max-w-lg max-h-[350px] lg:max-h-[450px] xl:max-h-[500px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>
    </Container>
  );
}
