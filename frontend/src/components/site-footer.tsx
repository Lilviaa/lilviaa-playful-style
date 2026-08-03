import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";
import logoAsset from "@/assets/lilviaa-logo.png.asset.json";
import { SizeGuide } from "@/components/size-guide";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-cocoa text-cream">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 md:flex-row md:justify-between lg:px-8">
        <div className="max-w-md">
          <div className="inline-block rounded-2xl bg-cream p-3 shadow-sm">
            <img src={logoAsset.url} alt="lilviaa" className="h-16 w-auto" />
          </div>
          <p className="mt-5 text-base leading-relaxed text-cream/90">
            Playful, high-quality clothing for the tiny humans who steal the show.
          </p>
          <div className="mt-5 space-y-1.5 text-base text-cream/90">
            <p><strong>Store:</strong> Lil Viaa, Mettupalayam Bus Stop, P.N. Road, Tiruppur, Tamil Nadu</p>
            <p><strong>Phone:</strong> +91 82201 27481 / +91 82201 27170</p>
          </div>
          <div className="mt-5 relative group cursor-pointer overflow-hidden rounded-2xl">
            <a 
              href="https://www.google.com/maps/search/Mettupalayam+Bus+Stop,+P.N.+Road,+Tiruppur" 
              target="_blank" 
              rel="noreferrer"
              className="absolute inset-0 z-10 flex items-center justify-center bg-cocoa/10 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100"
              aria-label="Open map in new tab"
            >
              <span className="rounded-full bg-cream px-4 py-2 text-sm font-bold text-cocoa shadow-pop">
                Open in Google Maps
              </span>
            </a>
            <iframe
              title="Store Location"
              src="https://www.google.com/maps?q=Mettupalayam+Bus+Stop,+P.N.+Road,+Tiruppur&output=embed"
              width="100%"
              height="140"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className="mt-7 flex gap-4">
            <a className="rounded-full bg-cream/10 p-3 transition-all hover:scale-105 hover:bg-cream/20" href="https://www.instagram.com/lil_viaa/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a className="rounded-full bg-cream/10 p-3 transition-all hover:scale-105 hover:bg-cream/20" href="https://api.whatsapp.com/send?phone=919843153154" target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            <a className="rounded-full bg-cream/10 p-3 transition-all hover:scale-105 hover:bg-cream/20" href="https://www.facebook.com/lilviaa" target="_blank" rel="noreferrer" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a className="rounded-full bg-cream/10 p-3 transition-all hover:scale-105 hover:bg-cream/20" href="https://www.youtube.com/@LilViaa-b4w" target="_blank" rel="noreferrer" aria-label="YouTube">
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 md:flex md:flex-wrap md:gap-16 lg:gap-24">
          <div>
            <h4 className="font-display text-xl tracking-wide text-cream">Shop</h4>
            <ul className="mt-5 space-y-4 text-base text-cream/80">
              <li><Link to="/shop" className="transition-colors hover:text-cream">All Products</Link></li>
              <li><Link to="/shop" search={{ tag: "new" }} className="transition-colors hover:text-cream">New Arrivals</Link></li>
              <li><Link to="/shop" search={{ tag: "bestseller" }} className="transition-colors hover:text-cream">Bestsellers</Link></li>
              <li><Link to="/shop" search={{ tag: "sale" }} className="transition-colors hover:text-cream">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-xl tracking-wide text-cream">Help</h4>
            <ul className="mt-5 space-y-4 text-base text-cream/80">
              <li><Link to="/faq" className="transition-colors hover:text-cream">FAQ</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-cream">Contact us</Link></li>
              <li>
                <SizeGuide>
                  <button className="text-left transition-colors hover:text-cream">Size Guide</button>
                </SizeGuide>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-display text-xl tracking-wide text-cream">Policies</h4>
            <ul className="mt-5 space-y-4 text-base text-cream/80">
              <li><Link to="/shipping" className="transition-colors hover:text-cream">Shipping Policy</Link></li>
              <li><Link to="/returns" className="transition-colors hover:text-cream">Return & Refund</Link></li>
              <li><Link to="/terms" className="transition-colors hover:text-cream">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="transition-colors hover:text-cream">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-4 border-t border-cream/10 px-6 py-5 text-cream/60 md:flex-row">
        <div className="text-sm">© {new Date().getFullYear()} Lil Viaaa. All Rights Reserved.</div>
        <div className="text-xs">
          Powered by <a href="https://www.arcvex.in/" target="_blank" rel="noopener noreferrer" className="font-semibold text-cream hover:underline">ARCVEX</a>
        </div>
      </div>
    </footer>
  );
}
