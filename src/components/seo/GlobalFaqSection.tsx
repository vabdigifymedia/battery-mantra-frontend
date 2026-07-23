import { DynamicFaq } from "@/components/seo/DynamicFaq";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Container } from "@/components/layout/Container";

export function GlobalFaqSection() {
  return (
    <Container size="xl" className="py-12 sm:py-16">
      <section aria-labelledby="faq" className="w-full">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-start">
          {/* FAQ Accordion side */}
          <div className="space-y-6 order-2 lg:pt-8">
            <SectionHeading
              eyebrow="FAQ"
              title={<span id="faq">Questions, answered</span>}
              align="left"
            />
            <DynamicFaq pageType="UNIVERSAL" context={{}} hideHeading />
          </div>

          {/* Image side */}
          <div className="hidden lg:flex justify-center order-1">
            <img
              src="/images/FAQ%20Side%20Image.jpeg"
              alt="FAQ"
              className="w-48 sm:w-64 lg:w-full max-w-md xl:max-w-lg h-auto object-contain drop-shadow-2xl lg:scale-105"
            />
          </div>
        </div>
      </section>
    </Container>
  );
}
