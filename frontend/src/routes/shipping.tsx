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
          We are committed to delivering your little one's outfits safely and quickly. Please review our shipping practices below.
        </p>

        <h2>Shipping Partners</h2>
        <p>
          Lilviaa ships products exclusively through <strong>DTDC</strong> to ensure reliable and trackable deliveries across the country.
        </p>

        <h2>Processing and Delivery Timelines</h2>
        <ul>
          <li><strong>Processing Time:</strong> Orders are typically processed and dispatched within <strong>2 to 3 working days</strong> from the time the order is successfully placed.</li>
          <li><strong>Delivery Time:</strong> Once dispatched, products generally reach customers within <strong>2 to 4 working days</strong>, depending on the delivery location.</li>
        </ul>

        <h2>Order Tracking</h2>
        <p>
          As soon as your order leaves our facility, you will receive a notification containing your DTDC tracking ID. You can use this ID to track your shipment directly on the courier's website.
        </p>

        <h2>Need Assistance?</h2>
        <p>
          If you have not received your order within 7 days of dispatch, please reach out to us immediately via WhatsApp or Instagram DM (@lil_viaa). For any urgent requirements or expedited shipping requests, we strongly recommend checking with us in advance before placing your order.
        </p>
      </div>
    </div>
  );
}
