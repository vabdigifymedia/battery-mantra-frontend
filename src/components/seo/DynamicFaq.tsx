import { useQuery } from "@tanstack/react-query";
import { publicFaqsQuery } from "@/queries";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Spinner } from "@/components/feedback/Spinner";

interface DynamicFaqProps {
  pageType: "UNIVERSAL" | "CATEGORY" | "MANUFACTURER" | "BRAND" | "BRAND_MODEL" | "PRODUCT";
  context: Record<string, string>;
  hideHeading?: boolean;
}

export function DynamicFaq({ pageType, context, hideHeading = false }: DynamicFaqProps) {
  const { data: faqs = [], isLoading } = useQuery(publicFaqsQuery(pageType));

  const replacePlaceholders = (text: string) => {
    let result = text;
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, "gi");
      result = result.replace(regex, value);
    }
    return result;
  };

  if (isLoading) {
    return <div className="py-8 flex justify-center"><Spinner /></div>;
  }

  if (!faqs.length) return null;

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      {!hideHeading && (
        <h2 className="text-3xl font-display font-bold text-center mb-8">Frequently Asked Questions</h2>
      )}
      <Accordion type="single" collapsible className="w-full space-y-4">
        {faqs.map((faq) => (
          <AccordionItem key={faq.faqId} value={faq.faqId} className="border rounded-lg bg-card px-4 shadow-sm">
            <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline hover:text-primary">
              {replacePlaceholders(faq.title)}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-4">
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
