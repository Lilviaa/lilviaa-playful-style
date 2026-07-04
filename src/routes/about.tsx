import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Heart, Leaf, Users } from "lucide-react";
import { featured } from "@/lib/products";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story — lilviaa" },
      {
        name: "description",
        content:
          "lilviaa is a little clothing label with a big heart — playful, thoughtful, and made for the way kids actually live.",
      },
      { property: "og:title", content: "Our story — lilviaa" },
      { property: "og:description", content: "A little clothing label with a big heart." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="bg-hero px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Our story</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-cocoa md:text-6xl">
            A little brand with a very big heart.
          </h1>
          <p className="mt-5 text-lg text-cocoa/80">
            lilviaa started at a kitchen table, cutting fabric for a niece who
            refused to wear anything scratchy. Three years later, we make clothes
            for thousands of tiny critics across India — and the rule is still the
            same: if it isn't soft enough for our own kids, it isn't good enough.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {featured.slice(0, 3).map((p, i) => (
            <img
              key={p.slug}
              src={p.image}
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
          What we care about
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { i: Heart, t: "Soft on skin", d: "Only breathable, tested fabrics that pass the 'nap-test'." },
            { i: Leaf, t: "Kind by design", d: "Coconut buttons, low-waste cutting, natural dyes wherever we can." },
            { i: Sparkles, t: "Playful always", d: "Prints and colors that look like childhood feels." },
            { i: Users, t: "Made with makers", d: "Partnered with small units in India who we know by name." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-3xl bg-card p-6 shadow-cute">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-butter text-cocoa">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl text-cocoa">{t}</h3>
              <p className="mt-2 text-sm text-cocoa/70">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
