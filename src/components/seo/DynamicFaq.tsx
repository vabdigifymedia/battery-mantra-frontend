import { useQuery } from "@tanstack/react-query";
import { publicFaqsQuery } from "@/queries";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Spinner } from "@/components/feedback/Spinner";
import { useLocationStore } from "@/store/useLocationStore";
import { getDeliveryTimeText } from "@/lib/delivery";
import { applySeoTemplate } from "@/lib/utils";

interface DynamicFaqProps {
  pageType: "UNIVERSAL" | "CATEGORY" | "MANUFACTURER" | "BRAND" | "MANUFACTURER_MODEL" | "PRODUCT";
  context?: Record<string, string>;
  hideHeading?: boolean;
}

export function DynamicFaq({ pageType, context = {}, hideHeading = false }: DynamicFaqProps) {
  const { data: faqs = [], isLoading } = useQuery(publicFaqsQuery(pageType));
  const { city } = useLocationStore();

  const cityName = context.city_name || city?.cityName || "your city";
  const deliveryTime = context.delivery_time || getDeliveryTimeText(null, null, city?.cityName);

  const mergedContext = {
    city_name: cityName,
    delivery_time: deliveryTime,
    ...context,
  };
  if (!mergedContext.delivery_time) mergedContext.delivery_time = deliveryTime;
  if (!mergedContext.city_name) mergedContext.city_name = cityName;

  const replacePlaceholders = (text: string) => {
    if (!text) return "";
    // STRICT RULE: Only replace variables enclosed in curly brackets like {price}, {product_name}, {city_name}
    return applySeoTemplate(text, mergedContext);
  };

  if (isLoading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Spinner /></div>;
  }

  if (!faqs.length) return null;

  return (
    <div className="w-full">
      {!hideHeading && (
        <h2 className="text-3xl font-display font-bold text-center mb-8">Frequently Asked Questions</h2>
      )}
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.faqId} value={faq.faqId} className="border-b border-border/50">
            <AccordionTrigger className="text-left font-medium text-base hover:no-underline hover:text-primary py-4">
              {replacePlaceholders(faq.title)}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: replacePlaceholders(faq.description) }}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
