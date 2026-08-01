import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { LogOut, Package, User, Settings, Loader2 } from "lucide-react";
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
  const { user, logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate({ to: "/login", replace: true });
  }

  const navItems = [
    { label: "Overview", to: "/account", icon: User, exact: true },
    { label: "My Orders", to: "/account/orders", icon: Package, exact: false },
    { label: "Settings", to: "/account/settings", icon: Settings, exact: false },
  ];
  const currentTabObj = navItems.find(item => item.exact ? pathname === item.to : pathname.startsWith(item.to));
  const currentTab = currentTabObj?.label || "My Account";

  let tabDescription = `Welcome back, ${user.full_name}!`;
  if (currentTab === "Overview") {
    tabDescription = `Welcome back, ${user.full_name}! Manage your account and track your latest activity.`;
  } else if (currentTab === "My Orders") {
    tabDescription = "View your orders and track their delivery status.";
  } else if (currentTab === "Settings") {
    tabDescription = "Manage your account settings and security preferences.";
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl text-cocoa md:text-5xl">{currentTab}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {tabDescription}
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2 text-sm font-semibold text-cocoa transition-colors hover:bg-sand hover:text-primary w-fit disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>

      <div className="flex gap-4 border-b border-border overflow-x-auto pb-1 mb-8 hide-scrollbar">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap px-4 py-3 font-semibold transition-all border-b-2",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-cocoa hover:border-cocoa/30"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
