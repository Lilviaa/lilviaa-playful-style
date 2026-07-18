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
    q: "What age group do you offer clothing for?",
    a: "We offer premium kidswear for little boys aged 6 months to 6 years. Please refer to our size chart to choose the perfect fit for your child.",
  },
  {
    q: "How do I choose the right size?",
    a: "We recommend referring to our size chart before placing your order. If your child falls between two sizes, we suggest choosing the next size for a more comfortable fit.",
  },
  {
    q: "What fabrics do you use?",
    a: "We carefully select soft, comfortable, and child-friendly fabrics suitable for everyday wear. All our ethnic wear includes a soft cotton inner lining for enhanced comfort.",
  },
  {
    q: "How long will my order take to arrive?",
    a: "Estimated delivery timelines are: Tamil Nadu: 2–4 business days, Rest of India: 3–7 business days. Delivery times may vary depending on your location and courier service availability.",
  },
  {
    q: "How can I track my order?",
    a: "Once your order has been shipped, you will receive tracking details via SMS, WhatsApp, or email, based on the contact information provided during checkout.",
  },
  {
    q: "Do you accept returns or exchanges?",
    a: "Lil Viaa follows a No Return & No Refund Policy. However, if you receive a damaged or incorrect product, please contact us within 48 hours of delivery with your order details, an unboxing video, and clear product photographs. Our team will review your request and assist you accordingly.",
  },
  {
    q: "Do you offer bulk or wholesale orders?",
    a: "Yes, we do offer bulk and wholesale orders. Please contact our team for more information regarding wholesale pricing and order requirements.",
  },
  {
    q: "How should I care for Lil Viaa garments?",
    a: "To maintain the quality, comfort, and longevity of your Lil Viaa garments, please follow the wash care instructions provided on the product label.",
  }
];

function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-24">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl text-cocoa md:text-5xl">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find answers to common questions about our products, sizing, and shipping.
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
          href="https://api.whatsapp.com/send?phone=919843153154" 
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
