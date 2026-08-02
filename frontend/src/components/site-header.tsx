import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, X, UserCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/lilviaa-logo.png.asset.json";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/about", label: "Our Story" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, logout, isLoggingOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:gap-4 md:px-6">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-2 text-cocoa hover:bg-sand md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoAsset.url}
            alt="lilviaa"
            className="h-10 w-auto md:h-12"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = pathname === n.to && !n.search;
            return (
              <Link
                key={n.label}
                to={n.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-cocoa/80 hover:bg-sand hover:text-cocoa",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <div
            className={cn(
              "flex items-center overflow-hidden transition-all duration-300 ease-in-out",
              searchOpen ? "w-32 sm:w-64 opacity-100" : "w-0 opacity-0"
            )}
          >
            <input
              type="search"
              placeholder="Search..."
              autoFocus={searchOpen}
              className="w-full rounded-full border-2 border-border bg-card py-1.5 pl-4 pr-3 text-sm text-cocoa placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  navigate({ to: "/search", search: { q: val }, replace: true });
                } else if (pathname === "/search") {
                  navigate({ to: "/search", search: { q: "" }, replace: true });
                }
              }}
            />
          </div>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={cn(
              "rounded-full p-2 transition-colors hover:bg-sand",
              searchOpen ? "bg-sand text-primary" : "text-cocoa"
            )}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            to="/wishlist"
            className="hidden relative rounded-full p-2 text-cocoa hover:bg-sand sm:inline-flex"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-cute">
                {wishlistCount}
              </span>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full p-2 text-cocoa hover:bg-sand outline-none cursor-pointer"
                  aria-label="Account Menu"
                >
                  <UserCircle className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="flex items-center gap-3 p-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-cocoa">{user.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate w-[100px]">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer w-full">
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/settings" className="cursor-pointer w-full">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/orders" className="cursor-pointer w-full">
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    if (isLoggingOut) {
                      e.preventDefault();
                      return;
                    }
                    logout();
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              search={{ redirect: pathname !== "/" ? pathname : undefined }}
              className="rounded-full p-2 text-cocoa hover:bg-sand"
              aria-label="Account"
            >
              <UserCircle className="h-5 w-5" />
            </Link>
          )}
          <Link
            to="/cart"
            className="relative rounded-full p-2 text-cocoa hover:bg-sand"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-cute">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-cream px-4 py-3 md:hidden">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-cocoa hover:bg-sand"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
