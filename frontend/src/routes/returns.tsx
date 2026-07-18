import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — lilviaa" },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-24">
      <h1 className="font-display text-4xl text-cocoa md:text-5xl mb-8">Return & Refund Policy</h1>
      
      <div className="prose prose-stone max-w-none text-muted-foreground prose-headings:text-cocoa prose-headings:font-display">
        <p>
          At <strong>Lil Viaa</strong>, every order is carefully inspected and packed to ensure that you receive products of the highest quality.
        </p>

        <h2>No Return & No Refund Policy</h2>
        <p>
          We do <strong>not accept returns, exchanges, or offer refunds</strong> once an order has been placed, except in cases where you receive a <strong>damaged or incorrect product</strong>.
        </p>

        <h2>Damaged or Incorrect Orders</h2>
        <p>
          If you receive a damaged item or a product different from what you ordered:
        </p>
        <ul>
          <li>Please contact us within <strong>48 hours</strong> of receiving your order.</li>
          <li>Share your <strong>order details</strong>, along with an <strong>unboxing video</strong> and <strong>clear photographs</strong> of the product.</li>
          <li>Our support team will review your request and guide you through the next steps.</li>
        </ul>

        <h2>Important Notes</h2>
        <ul>
          <li>Slight variations in product colour may occur due to photography lighting, screen resolution, or display settings.</li>
          <li>Please refer to the size chart carefully before placing your order.</li>
          <li>Products that have been washed, used, altered, or damaged after delivery are not eligible for any return, exchange, or refund claim.</li>
        </ul>

        <p>
          At <strong>Lil Viaa</strong>, every piece is created with care, quality, and attention to detail. We sincerely appreciate your trust, understanding, and continued support.
        </p>
      </div>
    </div>
  );
}
