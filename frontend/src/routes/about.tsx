import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Heart, Leaf, Users, Star, Droplets, Sun, Moon, Shield, Smile } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useFeaturedProducts } from "@/lib/products-api";
import { useCmsSection, usePhilosophyCards } from "@/lib/admin/cms-api";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story â€” lilviaa" },
      {
        name: "description",
        content: "What makes Lil Viaa different from other brands? Comfort is the first language of love.",
      },
      { property: "og:title", content: "Our story â€” lilviaa" },
      { property: "og:description", content: "Comfort is the first language of love." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: featured = [], isLoading: isFeaturedLoading } = useFeaturedProducts();
  const { data: ourStory, isLoading: isStoryLoading } = useCmsSection("our_story");

  const { data: ourPhilosophySection, isLoading: isPhilosophyLoading } = useCmsSection("our_philosophy");
  const { data: philosophyCards = [], isLoading: isCardsLoading } = usePhilosophyCards();

  const isLoadingCMS = isStoryLoading || isPhilosophyLoading || isCardsLoading || isFeaturedLoading;

  const ICONS: Record<string, React.ElementType> = {
    Heart, Sparkles, Leaf, Users, Star, Droplets, Sun, Moon, Shield, Smile
  };

  if (isLoadingCMS) {
    return (
      <div className="min-h-screen animate-pulse bg-hero px-6 py-20 flex flex-col items-center">
        <div className="h-4 w-24 bg-primary/20 rounded-full mb-8"></div>
        <div className="h-16 w-3/4 max-w-2xl bg-cocoa/10 rounded-2xl mb-6"></div>
        <div className="h-32 w-full max-w-3xl bg-cocoa/10 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-hero px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Our story</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-cocoa md:text-6xl">
            {ourStory?.title || "What makes Lil Viaa different?"}
          </h1>
          <p className="mt-5 text-lg text-cocoa/80 leading-relaxed whitespace-pre-wrap">
            {ourStory?.body || "At Lil Viaa, we believe that comfort is the first language of love. Every garment is thoughtfully crafted using premium-quality fabrics, careful stitching, and timeless designs, ensuring little boys can move freely, feel confident, and stay comfortable throughout the day."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        {ourStory?.image_url ? (
          <img
            src={ourStory.image_url}
            alt="Our Story"
            className="aspect-video max-h-[600px] w-full rounded-3xl object-cover shadow-cute"
          />
        ) : (
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
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-3xl text-cocoa md:text-4xl">
          {ourPhilosophySection?.title || "Our Philosophy"}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {(philosophyCards.length > 0 ? philosophyCards : [
            {
              icon: "Heart",
              title: "Thoughtful Design",
              description: "Unlike brands that focus on fast-changing trends, we create timeless pieces that parents can trust for their quality, durability, and everyday comfort.",
            },
            {
              icon: "Sparkles",
              title: "Quiet Luxury",
              description: "Rather than bold statements, we focus on exceptional craftsmanship, premium materials, and refined details that make every outfit feel special.",
            },
            {
              icon: "Leaf",
              title: "Lasting Value",
              description: "We believe in buying better, not more. Every collection is designed to be versatile, long-lasting, and made to be worn and loved repeatedly.",
            },
            {
              icon: "Users",
              title: "Built on Trust",
              description: "We don't promise perfectionâ€”we promise thoughtfulness. From selecting the right fabric to perfecting the fit, we create clothing children genuinely enjoy wearing.",
            },
          ]).map((card: any, idx: number) => {
            const Icon = ICONS[card.icon] || Heart;
            return (
              <div key={idx} className="group h-full rounded-3xl bg-card p-6 shadow-cute flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-pop cursor-default">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-butter text-cocoa transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl text-cocoa">{card.title}</h3>
                <p className="mt-2 text-sm text-cocoa/70 flex-1">{card.description}</p>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 text-center">
          <p className="inline-block rounded-full bg-primary/10 px-6 py-3 text-lg font-bold text-primary">
            {ourPhilosophySection?.body || "Every Lil Viaa garment is designed for all-day comfort, timeless style, and lasting quality."}
          </p>
        </div>
      </section>
    </div>
  );
}

