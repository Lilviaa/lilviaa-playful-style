import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — lilviaa" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-24">
      <h1 className="font-display text-4xl text-cocoa md:text-5xl mb-8">Terms & Conditions</h1>
      
      <div className="prose prose-stone max-w-none text-muted-foreground prose-headings:text-cocoa prose-headings:font-display">
        <p>
          Welcome to <strong>Lil Viaa</strong>. By accessing our website and purchasing our products, you agree to the following Terms & Conditions.
        </p>

        <h2>1. Product Information</h2>
        <ul>
          <li>We make every effort to ensure that product colours, descriptions, images, and other details are displayed as accurately as possible.</li>
          <li>Slight variations in colour, texture, or appearance may occur due to photography lighting, fabric characteristics, and individual screen settings.</li>
          <li>Product measurements may have minor variations due to the garment manufacturing process.</li>
        </ul>

        <h2>2. Orders & Payments</h2>
        <ul>
          <li>Orders are confirmed only after successful payment.</li>
          <li>Customers are requested to ensure that all information provided during checkout, including name, address, and contact details, is accurate.</li>
          <li>Lil Viaa reserves the right to cancel or refuse any order due to incorrect pricing, product availability, suspected fraudulent activity, or other unforeseen circumstances.</li>
        </ul>

        <h2>3. Shipping & Delivery</h2>
        <ul>
          <li>Orders will be processed and shipped in accordance with our Shipping Policy.</li>
          <li>Delivery timelines are estimated and may vary depending on your location and courier service availability.</li>
          <li>Lil Viaa is not responsible for delays caused by courier partners, weather conditions, public holidays, or other circumstances beyond our reasonable control.</li>
        </ul>

        <h2>4. Returns & Refunds</h2>
        <ul>
          <li>Lil Viaa follows a <strong>No Return & No Refund Policy</strong>, except in cases where a damaged or incorrect product has been delivered.</li>
          <li>Customers must contact us within <strong>48 hours</strong> of receiving their order and provide a valid unboxing video along with clear product photographs for verification.</li>
        </ul>

        <h2>5. Size Selection</h2>
        <ul>
          <li>Customers are advised to refer to the size chart carefully before placing an order.</li>
          <li>Lil Viaa is not responsible for issues arising from incorrect size selection made by the customer.</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <ul>
          <li>All content available on the Lil Viaa website, including logos, images, product photographs, designs, graphics, text, and other brand assets, is the intellectual property of Lil Viaa.</li>
          <li>No content may be copied, reproduced, modified, distributed, or used without prior written permission from Lil Viaa.</li>
        </ul>

        <h2>7. Website Usage</h2>
        <ul>
          <li>By using this website, you agree not to engage in any activity that may interfere with the security, functionality, or proper operation of the website.</li>
          <li>Any misuse of the website may result in the restriction or termination of access.</li>
        </ul>

        <h2>8. Policy Updates</h2>
        <ul>
          <li>Lil Viaa reserves the right to update, modify, or revise these Terms & Conditions at any time without prior notice.</li>
          <li>Any changes will be published on this page and will take effect immediately upon posting.</li>
        </ul>

        <h2>Contact Us</h2>
        <p>
          For any questions, concerns, or support regarding these Terms & Conditions, please contact the <strong>Lil Viaa Customer Support Team</strong>.
        </p>
        <p>Thank you for choosing <strong>Lil Viaa</strong>.</p>
      </div>
    </div>
  );
}
