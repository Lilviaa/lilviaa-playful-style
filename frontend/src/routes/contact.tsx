import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Instagram, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — lilviaa" },
      { name: "description", content: "Get in touch with the lilviaa team — we love hearing from little humans and their grown-ups." },
      { property: "og:title", content: "Contact us — lilviaa" },
      { property: "og:description", content: "Get in touch with the lilviaa team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div>
      <section className="bg-hero px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl leading-tight text-cocoa md:text-5xl">
            Contact Us
          </h1>
          <p className="mt-6 text-cocoa/90 leading-relaxed md:text-lg">
            We value your feedback and inquiries. Whether you have a product question, need order assistance, or wish to share your thoughts, our dedicated team is here to help. We will respond promptly and look forward to hear from you.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          {[
            { i: Mail, t: "Email us", d: "lilviaa.byutsav@gmail.com", href: "mailto:lilviaa.byutsav@gmail.com" },
            { i: MessageCircle, t: "WhatsApp", d: "+91 8220127475", href: "https://api.whatsapp.com/message/UJG2PQ2RDW7BH1" },
            { i: Instagram, t: "Instagram", d: "@lil_viaa", href: "https://www.instagram.com/lil_viaa/" },
            { i: MapPin, t: "Store", d: "Muthaiyan Layout, Vellaingadu, Tiruppur, TN 641604", href: "https://www.google.com/maps/search/Lilviaa+Store,+Muthaiyan+Layout,+Vellaingadu,+Tirupur-641604/@11.116339,77.344759,10z?hl=en-US&entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D" },
          ].map(({ i: Icon, t, d, href }) => (
            <a key={t} href={href} target={href.startsWith("http") ? "_blank" : "_self"} rel="noreferrer" className="group flex items-center gap-5 rounded-3xl bg-card p-6 shadow-cute transition-all hover:-translate-y-1 hover:bg-cream/80 hover:shadow-pop">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint text-cocoa shadow-sm transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cocoa/50">{t}</div>
                <div className="mt-1 font-display text-lg text-cocoa md:text-xl">{d}</div>
              </div>
            </a>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Message sent!", { description: "We will respond promptly." });
            (e.target as HTMLFormElement).reset();
          }}
          className="rounded-[2rem] bg-card p-8 shadow-cute md:p-10"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl text-cocoa md:text-4xl">Send Message</h2>
            <p className="font-bold text-primary mt-2">Happy to hear 😊</p>
          </div>
          <div className="mt-4 grid gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                required
                placeholder="First Name"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
              />
              <input
                required
                placeholder="Last Name"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                required
                type="email"
                placeholder="Email ID"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
              />
              <input
                required
                type="email"
                placeholder="Confirm Email"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
              />
            </div>
            <div>
              <input
                required
                placeholder="Subject"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-cocoa/60">0 of 24 max words.</p>
            </div>
            <div>
              <textarea
                required
                rows={5}
                placeholder="Drop Us a Line"
                className="w-full resize-none rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-cocoa/60">0 of 500 max words.</p>
            </div>
            <div className="mt-2 text-left">
              <button
                type="submit"
                className="rounded-full border-2 border-cocoa bg-transparent px-8 py-2.5 text-sm font-bold tracking-wide text-cocoa transition-colors hover:bg-cocoa hover:text-cream"
              >
                SEND MESSAGE
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
