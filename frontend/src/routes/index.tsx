import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Ruler, Star, AlertCircle, Heart, Gem, Baby, MapPin } from "lucide-react";
import { featured, categories } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import logoAsset from "@/assets/lilviaa-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const heroImages = [
  "/asset/Images/KVR00022-1-scaled-1-1-1.jpg",
  "/asset/Images/KVR00026-1-scaled-1-1-1.jpg",
  "/asset/Images/KVR00058-1-scaled-1-1-1.jpg",
  "/asset/Images/KVR00114-1-scaled-1-1-1.jpg",
  "/asset/Images/KVR00130-1-scaled-1-1-1.jpg",
  "/asset/Images/KVR00145-1-scaled-1-1-1.jpg",
  "/asset/Images/KVR00238-1-scaled-1-1-1.jpg",
  "/asset/Images/KVR00248-1-scaled-1-1-1.jpg",
  "/asset/Images/KVR00361-1-scaled-1-1-1.jpg",
];

function HomePage() {
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      {/* HERO */}
      <section className="bg-hero relative overflow-hidden">
        <div className="mx-auto flex flex-col-reverse md:flex-row-reverse items-stretch max-w-[1500px]">
          
          {/* IMAGE HALF */}
          <div className="relative w-full md:w-1/2 h-[450px] md:h-auto min-h-[500px] lg:min-h-[700px]">
            {/* The Arched Image Container */}
            <ScrollReveal className="absolute bottom-0 inset-x-4 top-4 md:inset-x-auto md:right-0 md:left-6 lg:left-12 md:top-8 lg:top-12 overflow-hidden rounded-t-[3rem] md:rounded-t-none md:rounded-tl-[6rem] lg:rounded-tl-[10rem] shadow-2xl bg-sand">
              <div 
                className="flex h-full w-full transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${currentHeroImage * 100}%)` }}
              >
                {heroImages.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt="Lilviaa clothing"
                    className="h-full w-full flex-shrink-0 object-cover object-top"
                  />
                ))}
              </div>
            </ScrollReveal>
            
            {/* Decorative Badges */}
            <div className="absolute bottom-6 left-8 z-10 flex flex-col gap-3 md:bottom-8 md:left-8 lg:bottom-12 lg:left-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cream/40 bg-cream/80 px-5 py-2.5 text-sm font-bold text-cocoa shadow-sm backdrop-blur-md transition-transform hover:scale-105 cursor-default">
                ✨ Shop favourite
              </span>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cream/40 bg-cream/80 px-5 py-2.5 text-sm font-bold text-cocoa shadow-sm backdrop-blur-md transition-transform hover:scale-105 cursor-default">
                💚 100% cotton
              </span>
            </div>
          </div>

          {/* TEXT HALF */}
          <div className="relative z-10 flex w-full flex-col justify-center px-6 py-16 md:w-1/2 md:py-24 lg:px-16">
            <ScrollReveal className="max-w-xl mx-auto md:mr-auto md:ml-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-cream/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cocoa shadow-cute">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> New drop · Festive '26
              </span>
              <h1 className="mt-8 font-display text-5xl leading-[1.05] text-cocoa md:text-6xl lg:text-7xl">
                Made for{" "}
                <span className="relative inline-block text-primary">
                  Little Gentlemen
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
              <p className="mt-8 text-lg text-cocoa/80 leading-relaxed">
                Every garment is thoughtfully crafted using premium-quality fabrics and timeless designs, ensuring your little ones stay comfortable all day.
              </p>
              <div className="mt-10 flex flex-wrap gap-3 sm:gap-4">
                <Link
                  to="/shop"
                  className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground shadow-pop transition-all hover:scale-105 active:scale-95 sm:w-auto"
                >
                  Shop the collection
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border-2 border-cocoa/15 bg-cream/60 px-8 py-3.5 text-sm font-bold text-cocoa hover:bg-cream transition-colors"
                >
                  Our story
                </Link>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* TRUST BAR */}
      <ScrollReveal className="border-y border-border/60 bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 sm:grid-cols-2 md:grid-cols-5">
          {[
            { icon: Heart, label: "Comfort First" },
            { icon: Gem, label: "Premium Fabric" },
            { icon: Baby, label: "6M–6Y Boys" },
            { icon: MapPin, label: "Made in India" },
            { icon: Truck, label: "Free Shipping ₹3K+" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-sm font-semibold text-cocoa">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand text-primary">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Shop by mood</p>
            <h2 className="mt-2 font-display text-3xl text-cocoa md:text-5xl">
              Little wardrobes,<br />big personality.
            </h2>
          </div>
          <Link to="/shop" className="group inline-flex items-center gap-2 self-start sm:self-end rounded-full border-2 border-cocoa/10 bg-transparent px-6 py-2.5 text-sm font-bold text-cocoa transition-all hover:border-cocoa hover:bg-cocoa hover:text-cream">
            View all collections <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => {
            const p = featured[(i + 1) * 2] ?? featured[i];
            return (
              <ScrollReveal key={c.slug} direction="up" delay={i * 0.1}>
                <Link
                  to="/shop"
                  search={{ category: c.slug }}
                  className="group relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-[2.5rem] bg-card p-6 shadow-cute transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-pop"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 z-0 bg-cocoa/20">
                    <img
                      src={p.image}
                      alt={c.label}
                      className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                    />
                  </div>
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-cocoa/90 opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                  
                  {/* Emoji / Tag */}
                  <div className="relative z-20 self-start rounded-full bg-cream/95 px-4 py-2 text-xl shadow-sm backdrop-blur-md transition-transform duration-500 ease-out group-hover:rotate-[-8deg] group-hover:scale-110">
                    {c.emoji}
                  </div>

                  {/* Content */}
                  <div className="relative z-20 mt-auto translate-y-4 transition-transform duration-500 ease-out group-hover:translate-y-0">
                    <h3 className="font-display text-3xl text-cream md:text-4xl">{c.label}</h3>
                    <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-pop">
                        Explore {c.label.toLowerCase()} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <ScrollReveal className="mx-auto max-w-7xl px-6 py-8">
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
      </ScrollReveal>

      {/* PROMISE / EDITORIAL */}
      <ScrollReveal className="mx-auto mt-20 max-w-7xl overflow-hidden rounded-[2.5rem] bg-cocoa px-6 py-16 text-cream md:px-16 md:py-24 mb-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-butter">The lilviaa philosophy</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
              All-day comfort.<br/>Timeless style.<br/>Lasting quality.
            </h2>
            <p className="mt-5 max-w-md text-cream/80">
              We don't promise perfection—we promise thoughtfulness. Every collection is designed to be versatile, long-lasting, and made to be worn and loved repeatedly.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 text-center">
              {[
                { n: "100%", l: "Premium quality" },
                { n: "0", l: "Fast fashion" },
                { n: "24/7", l: "All-day comfort" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-cream/5 p-3 sm:p-4">
                  <div className="font-display text-2xl sm:text-3xl text-butter">{s.n}</div>
                  <div className="mt-1 text-[10px] sm:text-xs text-cream/70">{s.l}</div>
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
      </ScrollReveal>

      {/* TESTIMONIALS */}
      <ScrollReveal className="mx-auto max-w-7xl px-6 py-20">
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
      </ScrollReveal>
    </main>
  );
}
