import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Heart, Leaf, Users } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useFeaturedProducts } from "@/lib/products-api";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story — lilviaa" },
      {
        name: "description",
        content: "What makes Lil Viaa different from other brands? Comfort is the first language of love.",
      },
      { property: "og:title", content: "Our story — lilviaa" },
      { property: "og:description", content: "Comfort is the first language of love." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: featured = [], isLoading } = useFeaturedProducts();

  return (
    <div>
      <section className="bg-hero px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Our story</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-cocoa md:text-6xl">
            What makes Lil Viaa different?
          </h1>
          <p className="mt-5 text-lg text-cocoa/80 leading-relaxed">
            At Lil Viaa, we believe that <strong>comfort is the first language of love</strong>. Every garment is thoughtfully crafted using premium-quality fabrics, careful stitching, and timeless designs, ensuring little boys can move freely, feel confident, and stay comfortable throughout the day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {featured.slice(0, 3).map((p, i) => (
            <img
              key={p.slug}
              src={p.image || "/fallback-image.jpg"}
              alt=""
              className={`aspect-[3/4] w-full rounded-3xl object-cover shadow-cute ${
                i === 1 ? "md:mt-10" : ""
              }`}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-3xl text-cocoa md:text-4xl">
          Our Philosophy
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            {
              i: Heart,
              t: "Thoughtful Design",
              d: "Unlike brands that focus on fast-changing trends, we create timeless pieces that parents can trust for their quality, durability, and everyday comfort.",
            },
            {
              i: Sparkles,
              t: "Quiet Luxury",
              d: "Rather than bold statements, we focus on exceptional craftsmanship, premium materials, and refined details that make every outfit feel special.",
            },
            {
              i: Leaf,
              t: "Lasting Value",
              d: "We believe in buying better, not more. Every collection is designed to be versatile, long-lasting, and made to be worn and loved repeatedly.",
            },
            {
              i: Users,
              t: "Built on Trust",
              d: "We don't promise perfection—we promise thoughtfulness. From selecting the right fabric to perfecting the fit, we create clothing children genuinely enjoy wearing.",
            },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-3xl bg-card p-6 shadow-cute flex flex-col">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-butter text-cocoa">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl text-cocoa">{t}</h3>
              <p className="mt-2 text-sm text-cocoa/70 flex-1">{d}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="inline-block rounded-full bg-primary/10 px-6 py-3 text-lg font-bold text-primary">
            Every Lil Viaa garment is designed for all-day comfort, timeless style, and lasting quality.
          </p>
        </div>
      </section>
    </div>
  );
}
