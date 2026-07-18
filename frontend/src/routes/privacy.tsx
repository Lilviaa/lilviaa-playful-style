import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — lilviaa" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-24">
      <h1 className="font-display text-4xl text-cocoa md:text-5xl mb-8">Privacy Policy</h1>
      
      <div className="prose prose-stone max-w-none text-muted-foreground prose-headings:text-cocoa prose-headings:font-display">
        <p>
          At Lilviaa, we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how your personal information is collected, used, and shared when you visit or make a purchase from our store.
        </p>

        <h2>Personal Information We Collect</h2>
        <p>
          When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the Site, we collect information about the individual web pages or products that you view.
        </p>
        <p>
          When you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information, email address, and phone number. We refer to this information as "Order Information."
        </p>

        <h2>How Do We Use Your Personal Information?</h2>
        <p>
          We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to:
        </p>
        <ul>
          <li>Communicate with you;</li>
          <li>Screen our orders for potential risk or fraud; and</li>
          <li>Provide you with information or advertising relating to our products or services.</li>
        </ul>

        <h2>Sharing Your Personal Information</h2>
        <p>
          We share your Personal Information with third parties to help us use your Personal Information, as described above. For example, we use delivery partners like DTDC to ship your orders. We may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
        </p>

        <h2>Data Retention</h2>
        <p>
          When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.
        </p>
      </div>
    </div>
  );
}
