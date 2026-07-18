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
          At <strong>Lil Viaa</strong>, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or make a purchase.
        </p>

        <h2>Information We Collect</h2>
        <p>When you place an order or interact with our website, we may collect the following information:</p>
        <ul>
          <li>Name</li>
          <li>Contact Number</li>
          <li>Email Address</li>
          <li>Shipping and Billing Address</li>
          <li>Order Details</li>
          <li>Payment Information (processed securely through trusted payment providers)</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Process and deliver your orders.</li>
          <li>Provide customer support and assistance.</li>
          <li>Send order updates and important notifications.</li>
          <li>Improve our products, services, and overall shopping experience.</li>
          <li>Share information about new collections, special offers, and promotions, if you have chosen to receive such communications.</li>
        </ul>

        <h2>Payment Security</h2>
        <p>
          All payments are processed through secure and trusted payment gateways. <strong>Lil Viaa</strong> does not store your complete payment details, including card numbers, CVV, or banking information.
        </p>

        <h2>Sharing of Information</h2>
        <p>
          We do not sell, rent, or trade your personal information. Your information may only be shared with trusted third-party service providers, such as courier partners and payment gateways, solely for the purpose of processing and delivering your order.
        </p>

        <h2>Cookies</h2>
        <p>
          Our website may use cookies to enhance your browsing experience, understand customer preferences, and provide a more personalized shopping experience.
        </p>

        <h2>Data Protection</h2>
        <p>
          We take reasonable administrative, technical, and security measures to protect your personal information from unauthorized access, misuse, alteration, or disclosure.
        </p>

        <h2>Changes to This Privacy Policy</h2>
        <p>
          Lil Viaa reserves the right to update or modify this Privacy Policy from time to time. Any changes will be published on this page with immediate effect.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions or concerns regarding this Privacy Policy, please feel free to contact us through our official customer support channels.
        </p>
        <p>Thank you for trusting <strong>Lil Viaa</strong>.</p>
      </div>
    </div>
  );
}
