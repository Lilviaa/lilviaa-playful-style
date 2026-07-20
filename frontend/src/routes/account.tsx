import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { LogOut, Package, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — lilviaa" },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  const navItems = [
    { label: "Overview", to: "/account", icon: User, exact: true },
    { label: "My Orders", to: "/account/orders", icon: Package, exact: false },
    { label: "Settings", to: "/account/settings", icon: Settings, exact: false },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl text-cocoa md:text-5xl">My Account</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Welcome back, {user.full_name}!
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2 text-sm font-semibold text-cocoa transition-colors hover:bg-sand hover:text-primary w-fit"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-pop"
                      : "text-cocoa/70 hover:bg-card hover:text-cocoa"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
