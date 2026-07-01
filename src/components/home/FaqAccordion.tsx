import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How do I find the right battery for my vehicle?",
    a: "Use our Vehicle Finder — select your vehicle type, maker, model and variant to see all compatible batteries.",
  },
  {
    q: "Do you offer free installation?",
    a: "Yes. Every battery purchase includes free doorstep delivery and installation by a certified engineer.",
  },
  {
    q: "What is the battery exchange offer?",
    a: "You can exchange your old, working battery for an instant discount on a new one at checkout.",
  },
  {
    q: "What is the warranty period?",
    a: "Warranty varies by brand and product. The exact warranty period is shown on every product detail page.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery time depends on your PIN code. Check delivery on the homepage to see the estimate for your area.",
  },
];

export function FaqAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((f, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
          <AccordionContent>{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
