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
          At Lilviaa, we pour our heart into creating beautiful, high-quality garments for your children. We want you to be entirely satisfied with your purchase.
        </p>

        <h2>Unboxing Video Requirement</h2>
        <p>
          To process any claims for missing items, wrong items, or damages, an <strong>unboxing video is strictly mandatory</strong>. 
          The video must clearly show the sealed package being opened from the start, without any cuts or edits. Without a continuous unboxing video, we will unfortunately not be able to entertain any claims.
        </p>

        <h2>Exchanges</h2>
        <p>
          If you have an issue with sizing, we are happy to offer an exchange. 
        </p>
        <ul>
          <li>Exchange requests must be raised within <strong>48 hours</strong> of receiving the package.</li>
          <li>The garment must be unused, unwashed, and returned in its original packaging with all tags attached.</li>
          <li>Customers are responsible for the reverse shipping charges in the case of size exchanges.</li>
        </ul>

        <h2>Refunds</h2>
        <p>
          We do not offer direct monetary refunds. In the rare event that a product is defective and an exchange is not possible, we will issue <strong>store credit</strong> equal to the value of the item, which can be used for future purchases on Lilviaa.
        </p>

        <h2>How to Initiate a Request</h2>
        <p>
          To initiate an exchange or report a defect, please send us a Direct Message on Instagram at <strong>@lil_viaa</strong> with your order number and the unboxing video/photos of the issue. Our team will guide you through the process.
        </p>
      </div>
    </div>
  );
}
