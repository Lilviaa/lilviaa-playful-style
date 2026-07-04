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
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Say hi</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-cocoa md:text-6xl">
            We'd love to hear from you.
          </h1>
          <p className="mt-4 text-cocoa/80">
            Sizing questions, wholesale, press or just a hello — we reply within
            one working day.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-2">
        <div className="space-y-4">
          {[
            { i: Mail, t: "Email us", d: "hello@lilviaa.com" },
            { i: MessageCircle, t: "WhatsApp", d: "+91 90000 00000" },
            { i: Instagram, t: "Instagram", d: "@lilviaa" },
            { i: MapPin, t: "Studio", d: "Bengaluru, India" },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-cute">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-cocoa">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t}</div>
                <div className="font-display text-lg text-cocoa">{d}</div>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Message sent!", { description: "We'll reply within one working day." });
            (e.target as HTMLFormElement).reset();
          }}
          className="rounded-3xl bg-card p-6 shadow-cute"
        >
          <h2 className="font-display text-2xl text-cocoa">Send us a note</h2>
          <div className="mt-4 grid gap-3">
            <input
              required
              placeholder="Your name"
              className="rounded-2xl border-2 border-border bg-cream px-4 py-3 text-sm text-cocoa placeholder:text-cocoa/40 focus:border-primary focus:outline-none"
            />
            <input
              required
              type="email"
              placeholder="Your email"
              className="rounded-2xl border-2 border-border bg-cream px-4 py-3 text-sm text-cocoa placeholder:text-cocoa/40 focus:border-primary focus:outline-none"
            />
            <textarea
              required
              rows={5}
              placeholder="What's on your mind?"
              className="resize-none rounded-2xl border-2 border-border bg-cream px-4 py-3 text-sm text-cocoa placeholder:text-cocoa/40 focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop"
            >
              Send message
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
