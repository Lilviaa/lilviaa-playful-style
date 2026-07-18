import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    meta: [
      { title: "FAQ — lilviaa" },
    ],
  }),
});

const faqs = [
  {
    q: "How long does shipping take?",
    a: "Orders are typically processed within 2-3 working days. Once dispatched, deliveries through DTDC generally reach customers within 2 to 4 working days, depending on the delivery location.",
  },
  {
    q: "Do you offer international shipping?",
    a: "Currently, we only ship within India. We hope to expand our shipping destinations in the future!",
  },
  {
    q: "What is your return policy?",
    a: "We accept exchanges for sizing issues within 48 hours of delivery. Please note that an unboxing video without cuts is strictly mandatory to process any claims for missing items, wrong items, or damages. We do not offer direct monetary refunds, but provide store credit for defective items when an exchange isn't possible.",
  },
  {
    q: "How do I know what size to order?",
    a: "Each product page features a Size Guide button. We recommend measuring your child and comparing it to our size chart to ensure the perfect fit.",
  },
  {
    q: "How should I wash the clothes?",
    a: "Our garments are made from delicate, high-quality fabrics like mul cotton. We recommend gentle hand washing in cold water with mild detergent, and drying in the shade to preserve the colors and fabric integrity.",
  },
  {
    q: "Can I cancel my order?",
    a: "You can request an order cancellation before the item is dispatched by messaging us on WhatsApp or Instagram DM. Once an order has been shipped, it cannot be canceled.",
  }
];

function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-24">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl text-cocoa md:text-5xl">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find answers to common questions about our products, shipping, and returns.
        </p>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-cute md:p-10">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-display text-lg text-cocoa hover:text-primary hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-muted-foreground">Still have questions?</p>
        <a 
          href="https://api.whatsapp.com/message/UJG2PQ2RDW7BH1" 
          target="_blank" 
          rel="noreferrer"
          className="mt-2 inline-block font-bold text-primary hover:underline"
        >
          Contact us on WhatsApp
        </a>
      </div>
    </div>
  );
}
