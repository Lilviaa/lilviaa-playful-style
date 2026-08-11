import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Instagram, MapPin, Facebook, Youtube, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCompanySettings } from "@/lib/admin/settings-api";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — lilviaa" },
      { name: "description", content: "Get in touch with the lilviaa team." },
      { property: "og:title", content: "Contact us — lilviaa" },
      { property: "og:description", content: "Get in touch with the lilviaa team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useCompanySettings();

  const storeAddress = settings?.address_line 
    ? `${settings.address_line}, ${settings.city}, ${settings.state} - ${settings.pincode}`
    : "Lil Viaa, Mettupalayam Bus Stop, P.N. Road, Tiruppur, Tamil Nadu, India";
    
  const phone = settings?.phone_primary 
    ? `${settings.phone_primary} ${settings.phone_secondary ? `, ${settings.phone_secondary}` : ''}`
    : "+91 82201 27481, +91 82201 27170";
    
  const email = settings?.business_email || "lilviaa.byutsav@gmail.com";
  
  const instagram = settings?.instagram_url || "https://www.instagram.com/lil_viaa/";
  const facebook = settings?.facebook_url || "https://www.facebook.com/lilviaa";
  const youtube = settings?.youtube_url || "https://www.youtube.com/@LilViaa-b4w";
  
  const whatsappPhone = settings?.phone_primary 
    ? settings.phone_primary.replace(/[^0-9]/g, '') 
    : "919843153154";
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhone}`;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      toast.error("Please complete the captcha.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          turnstile_token: turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send message");
      }

      toast.success("Message sent!", { description: "We will respond promptly." });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      // Force captcha reset by clearing the token state
      setTurnstileToken("");
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            { i: Mail, t: "Business & Support Email", d: email, href: `mailto:${email}` },
            { i: Phone, t: "Phone Numbers", d: phone, href: `tel:${settings?.phone_primary || '+918220127481'}` },
            { i: MessageCircle, t: "WhatsApp", d: `+${whatsappPhone}`, href: whatsappUrl },
            { i: Instagram, t: "Instagram", d: "Instagram", href: instagram },
            { i: Facebook, t: "Facebook", d: "Facebook", href: facebook },
            { i: Youtube, t: "YouTube", d: "YouTube", href: youtube },
            { i: MapPin, t: "Business Address", d: storeAddress, href: "https://www.google.com/maps/search/Mettupalayam+Bus+Stop,+P.N.+Road,+Tiruppur" },
          ].map(({ i: Icon, t, d, href }) => (
            <a key={t} href={href} target={href.startsWith("http") ? "_blank" : "_self"} rel="noreferrer" className="group flex items-center gap-5 rounded-3xl bg-card p-6 shadow-cute transition-all hover:-translate-y-1 hover:bg-cream/80 hover:shadow-pop">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint text-cocoa shadow-sm transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cocoa/50">{t}</div>
                <div className="mt-1 font-display text-lg text-cocoa">{d}</div>
              </div>
            </a>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-card p-8 shadow-cute md:p-10 h-fit sticky top-24"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl text-cocoa md:text-4xl">Send Message</h2>
            <p className="font-bold text-primary mt-2">Happy to hear 😊</p>
          </div>
          <div className="mt-4 grid gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First Name"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
                disabled={isSubmitting}
              />
              <input
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last Name"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email ID"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
                disabled={isSubmitting}
              />
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone Number"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <input
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Subject"
                className="w-full rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Drop Us a Line"
                className="w-full resize-none rounded-md border border-cocoa/10 bg-cream/50 px-4 py-3.5 text-sm text-cocoa placeholder:text-cocoa/50 focus:border-primary focus:bg-cream focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mt-2 flex justify-center w-full">
              {/* Only render Turnstile if it's not currently submitting to prevent it from vanishing on fast interactions, but reset if token is empty */}
              <Turnstile 
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"} 
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => toast.error("Captcha failed to load. Please refresh.")}
                options={{
                  theme: 'light'
                }}
              />
            </div>

            <div className="mt-2 text-center md:text-left">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full border-2 border-cocoa bg-transparent px-8 py-2.5 text-sm font-bold tracking-wide text-cocoa transition-colors hover:bg-cocoa hover:text-cream disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    SENDING...
                  </>
                ) : (
                  "SEND MESSAGE"
                )}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
