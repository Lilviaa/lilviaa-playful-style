import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — lilviaa" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-24">
      <h1 className="font-display text-4xl text-cocoa md:text-5xl mb-8">Terms and Conditions</h1>
      
      <div className="prose prose-stone max-w-none text-muted-foreground prose-headings:text-cocoa prose-headings:font-display">
        <p>
          Welcome to Lilviaa. By accessing and shopping on this website, you indicate your unconditional acceptance of these terms and conditions. We reserve the right to update or revise these terms at our sole discretion. Your continued use of the site constitutes your acceptance of those changes.
        </p>

        <h2>1. General Conditions</h2>
        <p>
          We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve transmissions over various networks.
        </p>

        <h2>2. Products or Services</h2>
        <p>
          Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy. We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your computer monitor's display of any color will be accurate.
        </p>

        <h2>3. Accuracy of Billing and Account Information</h2>
        <p>
          We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. You agree to provide current, complete and accurate purchase and account information for all purchases made at our store.
        </p>

        <h2>4. Changes to Terms of Service</h2>
        <p>
          You can review the most current version of the Terms of Service at any time at this page. We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service by posting updates and changes to our website.
        </p>

        <h2>5. Contact Information</h2>
        <p>
          Questions about the Terms of Service should be sent to us via WhatsApp or Instagram DM.
        </p>
      </div>
    </div>
  );
}
