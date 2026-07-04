import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Truck, ShieldCheck, RefreshCw, Star } from "lucide-react";
import { featured, categories } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import logoAsset from "@/assets/lilviaa-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-cream/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cocoa shadow-cute">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> New drop · Festive '26
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-cocoa md:text-6xl lg:text-7xl">
              Big smiles,{" "}
              <span className="relative inline-block text-primary">
                tiny outfits
                <svg
                  className="absolute -bottom-2 left-0 w-full text-butter"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 8C50 2 150 2 198 8"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-5 max-w-md text-lg text-cocoa/80">
              Soft, playful, high-quality clothing for the tiny humans who steal
              every scene. Made in India, made to be lived in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
              >
                Shop the collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border-2 border-cocoa/15 bg-cream/60 px-6 py-3 text-sm font-bold text-cocoa hover:bg-cream"
              >
                Our story
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-5 text-sm text-cocoa/70">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-butter text-butter" />
                ))}
              </div>
              <span>4.9 from 2,400+ happy parents</span>
            </div>
          </div>

          <div className="relative">
            <div className="animate-float-slow relative mx-auto aspect-square max-w-md rounded-[3rem] bg-card p-4 shadow-pop rotate-2">
              <img
                src={featured[0].image}
                alt={featured[0].name}
                className="h-full w-full rounded-[2.4rem] object-cover"
              />
              <span className="absolute -left-4 top-6 rounded-full bg-mint px-4 py-2 text-xs font-bold text-cocoa shadow-cute -rotate-6">
                💚 100% cotton
              </span>
              <span className="absolute -right-4 bottom-16 rounded-full bg-butter px-4 py-2 text-xs font-bold text-cocoa shadow-cute rotate-6">
                ✨ Shop favourite
              </span>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden aspect-square w-40 rotate-[-8deg] rounded-3xl bg-card p-2 shadow-cute md:block">
              <img
                src={featured[7].image}
                alt=""
                className="h-full w-full rounded-2xl object-cover"
              />
            </div>
            <img
              src={logoAsset.url}
              alt=""
              aria-hidden
              className="animate-wiggle absolute -right-2 -top-4 hidden w-28 opacity-90 md:block"
            />
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 sm:grid-cols-2 md:grid-cols-4">
          {[
            { icon: Truck, label: "Free shipping over ₹999" },
            { icon: ShieldCheck, label: "Skin-safe, tested fabrics" },
            { icon: RefreshCw, label: "Easy 15-day returns" },
            { icon: Sparkles, label: "Handcrafted in India" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-sm font-semibold text-cocoa">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand text-primary">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Shop by mood</p>
            <h2 className="mt-2 font-display text-3xl text-cocoa md:text-4xl">
              Little wardrobes, big personality.
            </h2>
          </div>
          <Link to="/shop" className="hidden text-sm font-bold text-cocoa hover:text-primary sm:inline">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c, i) => {
            const bg = ["bg-blush", "bg-mint", "bg-butter", "bg-lilac"][i % 4];
            const p = featured[(i + 1) * 2] ?? featured[i];
            return (
              <Link
                key={c.slug}
                to="/shop"
                className={`group relative flex aspect-[4/5] flex-col overflow-hidden rounded-3xl ${bg} p-5 shadow-cute transition-transform hover:-translate-y-1`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <h3 className="mt-auto font-display text-2xl text-cocoa">{c.label}</h3>
                <span className="text-xs font-semibold text-cocoa/70">Shop now →</span>
                <img
                  src={p.image}
                  alt=""
                  className="absolute -bottom-6 -right-6 h-32 w-32 rounded-2xl object-cover shadow-cute rotate-6 transition-transform group-hover:rotate-3 group-hover:scale-105"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Loved by little ones</p>
            <h2 className="mt-2 font-display text-3xl text-cocoa md:text-4xl">Bestsellers this week</h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-cocoa hover:text-primary">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* PROMISE / EDITORIAL */}
      <section className="mx-auto mt-20 max-w-7xl overflow-hidden rounded-[2.5rem] bg-cocoa px-6 py-16 text-cream md:px-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-butter">The lilviaa promise</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
              Made soft.<br/>Made safe.<br/>Made to be twirled in.
            </h2>
            <p className="mt-5 max-w-md text-cream/80">
              Every stitch, every button, every print is chosen with tiny hands and
              wiggly bodies in mind. Breathable fabrics, wash-tested colors, and coconut
              buttons that won't nip.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { n: "50+", l: "Playful prints" },
                { n: "0", l: "Nasty chemicals" },
                { n: "15d", l: "Free returns" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-cream/5 p-4">
                  <div className="font-display text-3xl text-butter">{s.n}</div>
                  <div className="mt-1 text-xs text-cream/70">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src={featured[2].image}
              alt=""
              className="aspect-[3/4] w-full rounded-3xl object-cover shadow-cute rotate-[-3deg]"
            />
            <img
              src={featured[5].image}
              alt=""
              className="mt-10 aspect-[3/4] w-full rounded-3xl object-cover shadow-cute rotate-[3deg]"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-center font-display text-3xl text-cocoa md:text-4xl">
          Kind words from tiny critics (and their grown-ups)
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              q: "The softest cotton — my toddler refuses to take his kurta off. Bought three more!",
              a: "Priya M., Bengaluru",
            },
            {
              q: "Prints are gorgeous, sizing runs true, and shipping was crazy fast. lilviaa is our go-to now.",
              a: "Aditya S., Mumbai",
            },
            {
              q: "Finally, ethnic wear that doesn't itch! My daughter danced through the whole wedding.",
              a: "Rhea K., Delhi",
            },
          ].map((t, i) => {
            const bg = ["bg-blush", "bg-mint", "bg-butter"][i];
            return (
              <div key={i} className={`rounded-3xl ${bg} p-6 shadow-cute`}>
                <div className="flex gap-0.5 text-cocoa">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-cocoa" />
                  ))}
                </div>
                <p className="mt-4 font-display text-lg leading-snug text-cocoa">
                  "{t.q}"
                </p>
                <p className="mt-4 text-sm font-semibold text-cocoa/70">— {t.a}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
