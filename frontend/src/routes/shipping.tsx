import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping Policy — lilviaa" },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-24">
      <h1 className="font-display text-4xl text-cocoa md:text-5xl mb-8">Shipping Policy</h1>
      
      <div className="prose prose-stone max-w-none text-muted-foreground prose-headings:text-cocoa prose-headings:font-display">
        <p>
          At <strong>Lil Viaa</strong>, every order is carefully packed to ensure it reaches you safely, securely, and on time.
        </p>

        <h2>Order Processing</h2>
        <ul>
          <li>Orders are processed on the <strong>same day</strong> after payment confirmation.</li>
          <li>During new product launches, festive seasons, or promotional sale periods, order processing may take slightly longer than usual.</li>
        </ul>

        <h2>Shipping Timeline</h2>
        <ul>
          <li><strong>Tamil Nadu:</strong> 2–4 business days</li>
          <li><strong>Rest of India:</strong> 3–6 business days</li>
        </ul>
        <p>
          Please note that delivery timelines may vary depending on your location and the availability of courier services.
        </p>

        <h2>Shipping Charges</h2>
        <ul>
          <li><strong>Tamil Nadu (up to 1 kg):</strong> ₹60</li>
          <li><strong>Other States (up to 1 kg):</strong> ₹80</li>
        </ul>
        <p>
          Applicable shipping charges will be displayed at checkout before payment is completed.
          Free shipping is available on orders above <strong>₹3,000</strong> or through selected promotional campaigns.
        </p>

        <h2>Order Tracking</h2>
        <p>
          Once your order has been shipped, you will receive a tracking link via <strong>SMS, WhatsApp, or email</strong>, based on the contact information provided while placing your order.
        </p>

        <h2>Delivery</h2>
        <ul>
          <li>Please ensure that your shipping address and contact details are accurate at the time of placing your order.</li>
          <li>If a delivery attempt is unsuccessful due to an incorrect address or the recipient being unavailable, additional shipping charges may apply for re-delivery.</li>
        </ul>

        <h2>Delivery Delays</h2>
        <p>
          While we make every effort to deliver your order within the estimated timeframe, delays may occasionally occur due to weather conditions, public holidays, courier service disruptions, or other unforeseen circumstances beyond our control.
        </p>

        <h2>Damaged or Missing Packages</h2>
        <p>
          If your order arrives damaged or if any item is missing, please contact our customer support team within <strong>48 hours</strong> of receiving your package. Kindly include your order number along with an unboxing video and/or clear photographs so that we can assist you promptly.
        </p>

        <h2>Need Assistance?</h2>
        <p>
          If you have any questions regarding shipping or delivery, please feel free to contact our customer support team. We are always happy to assist you.
        </p>
      </div>
    </div>
  );
}
