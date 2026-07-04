import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Twitter, Heart } from "lucide-react";
import logoAsset from "@/assets/lilviaa-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-cocoa text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="rounded-2xl bg-cream p-3">
            <img src={logoAsset.url} alt="lilviaa" className="h-14 w-auto" />
          </div>
          <p className="mt-4 text-sm text-cream/80">
            Playful, high-quality clothing for the tiny humans who steal the show.
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg text-cream">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li><Link to="/shop">All Products</Link></li>
            <li><Link to="/shop">New Arrivals</Link></li>
            <li><Link to="/shop">Bestsellers</Link></li>
            <li><Link to="/shop">Sale</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg text-cream">Help</h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li><Link to="/contact">Contact us</Link></li>
            <li>Size Guide</li>
            <li>Shipping &amp; Returns</li>
            <li>FAQs</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg text-cream">Join the family</h4>
          <p className="mt-3 text-sm text-cream/80">
            Get 10% off your first order &amp; peek at new drops first.
          </p>
          <form className="mt-4 flex overflow-hidden rounded-full bg-cream p-1">
            <input
              type="email"
              placeholder="you@family.com"
              className="flex-1 bg-transparent px-3 text-sm text-cocoa placeholder:text-cocoa/50 focus:outline-none"
            />
            <button
              type="button"
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Sign up
            </button>
          </form>
          <div className="mt-5 flex gap-3">
            <a className="rounded-full bg-cream/10 p-2 hover:bg-cream/20" href="#" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a className="rounded-full bg-cream/10 p-2 hover:bg-cream/20" href="#" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <a className="rounded-full bg-cream/10 p-2 hover:bg-cream/20" href="#" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/60">
        Made with <Heart className="inline h-3 w-3 fill-primary text-primary" /> for little ones · © {new Date().getFullYear()} lilviaa
      </div>
    </footer>
  );
}
