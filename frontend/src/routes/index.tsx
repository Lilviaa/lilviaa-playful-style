import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Ruler, Star, AlertCircle, Heart, Gem, Baby, MapPin, Store, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { useFeaturedProducts as useDbFeaturedProducts, useProducts } from "@/lib/products-api";
import { useCategories } from "@/lib/categories-api";
import { useCategoryTiles, useFeaturedProducts as useCmsFeaturedProducts, useCmsSection, useHeroSlides } from "@/lib/admin/cms-api";
import { usePublicBanners } from "@/lib/admin/banners-api";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";
import { ScrollReveal } from "@/components/scroll-reveal";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function HomePage() {
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const { data: dbFeatured = [], isLoading: isLoadingProducts } = useDbFeaturedProducts();
  const { data: dbCategories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: allProducts = [] } = useProducts();
  
  const [topReviews, setTopReviews] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/reviews/featured`)
      .then((res: any) => res.json())
      .then((data: any) => setTopReviews(data))
      .catch(err => console.error("Failed to fetch featured reviews:", err));
  }, []);

  // CMS Hooks
  const { data: banners = [], isLoading: isLoadingBanners } = usePublicBanners();
  const heroBanner = banners.length > 0 ? banners[0] : null; // use first banner as hero
  const promoStrip: any = null; // Removed since the DB schema replaces the mock promo strip
  const { data: cmsCategoryTiles = [] } = useCategoryTiles();
  const { data: cmsFeaturedProducts = [] } = useCmsFeaturedProducts();
  const { data: heroSlides = [], isLoading: isLoadingSlides } = useHeroSlides();
  const { data: featuredSection } = useCmsSection("featured_products_section");

  // Merge CMS featured with actual product data
  const featured = cmsFeaturedProducts.length > 0
    ? cmsFeaturedProducts.map((fp: any) => allProducts.find((p: any) => p.id === fp.product_id)).filter(Boolean) as Product[]
    : dbFeatured;

  // Check event poster dates
  const isEventBannerActive = () => {
    if (!heroBanner || !heroBanner.image_url) return false;
    const now = new Date().getTime();
    const start = heroBanner.start_date ? new Date(heroBanner.start_date).getTime() : null;
    const end = heroBanner.end_date ? new Date(heroBanner.end_date).getTime() : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const defaultHeroImageUrls = heroSlides.map((s: any) => s.image_url).filter(Boolean);
  const activeHeroImages = isEventBannerActive() && heroBanner?.image_url
    ? [heroBanner.image_url, ...defaultHeroImageUrls]
    : defaultHeroImageUrls;

  const isLoadingHero = isLoadingBanners || isLoadingSlides;

  // Fallback if no images and not loading
  if (activeHeroImages.length === 0 && !isLoadingHero) {
    activeHeroImages.push("/asset/Images/KVR00022-1-scaled-1-1-1.webp");
  }

  const nextHeroImage = () => {
    setCurrentHeroImage((prev) => (prev + 1) % activeHeroImages.length);
  };

  const prevHeroImage = () => {
    setCurrentHeroImage((prev) => (prev === 0 ? activeHeroImages.length - 1 : prev - 1));
  };

  useEffect(() => {
    const interval = setInterval(nextHeroImage, 5000);
    return () => clearInterval(interval);
  }, [activeHeroImages.length]);

  return (
    <main>
      <style>{`
        @keyframes scrollMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: scrollMarquee 90s linear infinite;
        }
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>

      {/* MARQUEE (CMS Powered) */}
      {promoStrip && promoStrip.active && (
        <div className="marquee-container relative flex h-10 overflow-hidden bg-primary text-primary-foreground items-center">
          <Link to={promoStrip.cta_link || "#"} className="animate-marquee flex w-max items-center hover:opacity-90">
            {Array(10).fill(promoStrip.headline).map((text, i) => (
              <div key={i} className="flex items-center px-8 whitespace-nowrap text-sm font-semibold tracking-wide">
                {text.split(/\||•/).map((part: string, idx: number, arr: string[]) => (
                  <span key={idx} className="flex items-center">
                    <span>{part.trim()}</span>
                    {promoStrip.cta_text && idx === arr.length - 1 && <span className="underline ml-2 mr-1">{promoStrip.cta_text}</span>}
                    {idx < arr.length - 1 && <span className="mx-6 opacity-40">•</span>}
                  </span>
                ))}
                <span className="mx-6 opacity-40">•</span>
              </div>
            ))}
          </Link>
        </div>
      )}

      {/* HERO */}
      {(!heroBanner || heroBanner.active) && (
        <section className="bg-hero relative overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem]">
          <div className="mx-auto flex flex-col md:flex-row-reverse items-stretch w-full">

            {/* IMAGE HALF */}
            <div className="relative w-full md:w-1/2 h-[60vh] min-h-[450px] max-h-[600px] md:h-auto md:min-h-[500px] lg:min-h-[700px] md:max-h-none">
              {/* The Arched Image Container */}
              <div className="absolute inset-0 md:bottom-0 md:right-0 md:top-0 md:left-8 lg:left-12 overflow-hidden rounded-b-[2.5rem] md:rounded-t-none md:rounded-tl-[10rem] md:rounded-bl-3xl md:rounded-tr-3xl md:rounded-br-[4rem] shadow-lg md:shadow-2xl group">
                {/* Sliding Images */}
                <div
                  className="flex h-full w-full transition-transform duration-1000 ease-in-out"
                  style={{ transform: `translateX(-${currentHeroImage * 100}%)` }}
                >
                  {isLoadingHero ? (
                    <div className="h-full w-full min-w-full flex-shrink-0 bg-sand/60 animate-pulse rounded-b-[2.5rem] md:rounded-b-[4rem] md:rounded-tl-[10rem]"></div>
                  ) : (
                    activeHeroImages.map((src: string, index: number) => (
                      <img
                        key={src}
                        src={src}
                        alt="Lilviaa clothing"
                        className="h-full w-full min-w-full flex-shrink-0 object-cover object-top bg-sand/20"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        decoding={index === 0 ? "sync" : "async"}
                      />
                    ))
                  )}
                </div>

                {/* Navigation Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 lg:p-8 pointer-events-none">
                  {/* Arrows */}
                  <div className="flex h-full items-center justify-between w-full">
                    <button
                      onClick={(e) => { e.preventDefault(); prevHeroImage(); }}
                      className="pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-cream/40 text-cream backdrop-blur-md transition-all hover:bg-cream hover:text-cocoa hover:scale-110 opacity-0 group-hover:opacity-100 shadow-sm"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); nextHeroImage(); }}
                      className="pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-cream/40 text-cream backdrop-blur-md transition-all hover:bg-cream hover:text-cocoa hover:scale-110 opacity-0 group-hover:opacity-100 shadow-sm"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Dots Indicator */}
                  <div className="pointer-events-auto absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {activeHeroImages.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentHeroImage(idx)}
                        className={`h-2 rounded-full transition-all duration-500 ${idx === currentHeroImage ? "w-8 bg-cream shadow-sm" : "w-2 bg-cream/40 hover:bg-cream/70"
                          }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TEXT HALF */}
            <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-8 pb-16 md:items-start md:w-1/2 md:py-24 lg:px-16">
              <ScrollReveal className="max-w-xl mx-auto text-center md:mr-auto md:ml-0 md:text-left">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-cream/40 bg-cream/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cocoa/80 backdrop-blur-sm shadow-sm">
                  <Sparkles className="h-3 w-3 text-primary/90" />
                  {heroBanner?.subtitle || "Premium Kidswear"}
                </span>
                <h1 className="mt-6 font-display text-4xl sm:text-5xl leading-[1.1] text-cocoa md:text-6xl lg:text-7xl">
                  {(() => {
                    const text = heroBanner?.title || "Made for Little Gentlemen.";
                    
                    if (text === "Made for Little Gentlemen.") {
                      return (
                        <>
                          Made for <br />
                          <span className="whitespace-nowrap">
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
                          </span>
                        </>
                      );
                    }
                    
                    const parts = text.split('*');
                    if (parts.length >= 3) {
                      return (
                        <>
                          {parts[0]}
                          <span className="relative inline-block text-primary">
                            {parts[1]}
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
                          {parts.slice(2).join('*')}
                        </>
                      );
                    }
                    return text;
                  })()}
                </h1>
                <p className="mt-8 text-lg text-cocoa/80 leading-relaxed max-w-md">
                  {heroBanner?.description || "Every garment is thoughtfully crafted using premium-quality fabrics and timeless designs, ensuring your little ones stay comfortable all day."}
                </p>
                <div className="mt-10 flex flex-wrap gap-3 sm:gap-4">
                  <Link
                    to={heroBanner?.link_url || "/shop"}
                    className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground shadow-pop transition-all hover:scale-105 active:scale-95 sm:w-auto"
                  >
                    {"Shop the collection"}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </section>
      )}



      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 pt-8 pb-16">
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
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(cmsCategoryTiles.length > 0 ? cmsCategoryTiles : dbCategories.slice(0, 4)).map((c: any, i: number) => {
            const isCms = 'label' in c;
            const name = isCms ? c.label : c.name;
            const link = isCms ? c.link : `/shop?category=${c.slug}`;
            const imageUrl = isCms ? c.image_url : (allProducts.find((prod) => prod.category === c.slug && prod.image)?.image || "/fallback-image.svg");
            const slugOrId = isCms ? c.id : c.slug;

            return (
              <ScrollReveal key={slugOrId} direction="up" delay={i * 0.1}>
                <Link
                  to={link}
                  className="group relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-card p-4 sm:p-6 shadow-cute transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-pop"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 z-0 bg-cocoa/20">
                    <img
                      src={imageUrl}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                    />
                  </div>
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-cocoa/90 opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Emoji / Tag */}
                  {!isCms && c.emoji && (
                    <div className="relative z-20 self-start rounded-full bg-cream/95 px-4 py-2 text-xl shadow-sm backdrop-blur-md transition-transform duration-500 ease-out group-hover:rotate-[-8deg] group-hover:scale-110">
                      {c.emoji}
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative z-20 mt-auto translate-y-4 transition-transform duration-500 ease-out group-hover:translate-y-0">
                    <h3 className="font-display text-2xl sm:text-3xl text-cream md:text-4xl">{name}</h3>
                    <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-pop">
                        Explore {name.toLowerCase()} <ArrowRight className="h-3 w-3" />
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
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {featuredSection?.body || "Loved by little ones"}
            </p>
            <h2 className="mt-2 font-display text-3xl text-cocoa md:text-4xl">
              {featuredSection?.title || "Bestsellers this week"}
            </h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-cocoa hover:text-primary">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {isLoadingProducts ? (
            <p className="col-span-full text-center text-muted-foreground py-10">Loading bestsellers...</p>
          ) : (
            featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))
          )}
        </div>
      </ScrollReveal>

      {/* PROMISE / EDITORIAL */}
      <ScrollReveal className="mx-auto mt-20 max-w-7xl overflow-hidden rounded-[2.5rem] bg-cocoa px-6 py-16 text-cream md:px-16 md:py-24 mb-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-butter">At Lil Viaa, We Focus On</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
              All-day comfort.<br />Timeless style.<br />Lasting quality.
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
            {featuredSection?.image_url ? (
              <img
                src={featuredSection.image_url}
                alt="Editorial 1"
                className="aspect-[3/4] w-full rounded-3xl object-cover shadow-cute rotate-[-3deg]"
              />
            ) : featured.length > 2 && featured[2] ? (
              <img
                src={featured[2].image}
                alt=""
                className="aspect-[3/4] w-full rounded-3xl object-cover shadow-cute rotate-[-3deg]"
              />
            ) : null}

            {featuredSection?.secondary_image_url ? (
              <img
                src={featuredSection.secondary_image_url}
                alt="Editorial 2"
                className="mt-10 aspect-[3/4] w-full rounded-3xl object-cover shadow-cute rotate-[3deg]"
              />
            ) : featured.length > 5 && featured[5] ? (
              <img
                src={featured[5].image}
                alt=""
                className="mt-10 aspect-[3/4] w-full rounded-3xl object-cover shadow-cute rotate-[3deg]"
              />
            ) : null}
          </div>
        </div>
      </ScrollReveal>

      {/* TRUST BAR */}
      <ScrollReveal className="border-y border-border/60 bg-card">
        <div className="mx-auto flex w-max max-w-7xl flex-col items-start gap-6 px-6 py-8 sm:w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:flex-nowrap md:justify-between">
          {[
            { icon: Heart, label: "Comfort First" },
            { icon: Gem, label: "Premium Fabric" },
            { icon: Baby, label: "6M–6Y Boys" },
            { icon: MapPin, label: "Made in India" },
            { icon: Truck, label: "Free Shipping ₹3000" },
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

      {/* TESTIMONIALS */}
      <ScrollReveal className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-center font-display text-3xl text-cocoa md:text-4xl">
          Kind words from tiny critics (and their grown-ups)
        </h2>
        {topReviews.length > 3 ? (
          <div className="mt-10 overflow-hidden whitespace-nowrap mask-edges">
            <div className="flex gap-5 w-max animate-marquee pb-4">
              {[...topReviews, ...topReviews].map((t, i) => {
                const bg = ["bg-blush", "bg-mint", "bg-butter"][i % 3];
                return (
                  <div key={`${t.id}-${i}`} className={`w-80 whitespace-normal rounded-3xl ${bg} p-6 shadow-cute shrink-0`}>
                    <div className="flex gap-0.5 text-cocoa">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < t.rating ? "fill-cocoa" : "text-cocoa/30"}`} />
                      ))}
                    </div>
                    <p className="mt-4 font-display text-lg leading-snug text-cocoa">
                      "{t.text}"
                    </p>
                    <p className="mt-4 text-sm font-semibold text-cocoa/70">- {t.reviewer_name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {topReviews.length > 0 ? (
              topReviews.map((t, i) => {
                const bg = ["bg-blush", "bg-mint", "bg-butter"][i % 3];
                return (
                  <div key={t.id} className={`rounded-3xl ${bg} p-6 shadow-cute`}>
                    <div className="flex gap-0.5 text-cocoa">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < t.rating ? "fill-cocoa" : "text-cocoa/30"}`} />
                      ))}
                    </div>
                    <p className="mt-4 font-display text-lg leading-snug text-cocoa">
                      "{t.text}"
                    </p>
                    <p className="mt-4 text-sm font-semibold text-cocoa/70">- {t.reviewer_name}</p>
                  </div>
                );
              })
            ) : (
              <p className="col-span-full text-center text-cocoa/70">Check back soon for reviews!</p>
            )}
          </div>
        )}
      </ScrollReveal>
    </main>
  );


}

