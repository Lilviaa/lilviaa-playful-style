import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Settings, MapPin, User, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — lilviaa" },
    ],
  }),
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Settings saved successfully");
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-card p-6 shadow-cute md:p-8">
        <h2 className="flex items-center gap-2 font-display text-2xl text-cocoa mb-6">
          <Settings className="h-6 w-6 text-primary" /> Profile Settings
        </h2>

        <form onSubmit={handleSave} className="space-y-6 max-w-xl">
          <div className="space-y-4">
            <h3 className="font-display text-lg text-cocoa border-b border-border pb-2 flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-cocoa">Full Name</label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-cocoa">Phone Number</label>
                <input
                  type="tel"
                  defaultValue={user.phone || ""}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-cocoa">Email Address</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  disabled
                  className="w-full rounded-xl border-2 border-border bg-background/50 px-4 py-2 text-sm text-muted-foreground focus:outline-none opacity-70 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-display text-lg text-cocoa border-b border-border pb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Default Address
            </h3>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-cocoa">Street Address</label>
                <input
                  type="text"
                  defaultValue="123 Playful Lane, Apt 4B"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-cocoa">City</label>
                  <input
                    type="text"
                    defaultValue="Mumbai"
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-cocoa">State</label>
                  <input
                    type="text"
                    defaultValue="Maharashtra"
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-cocoa">PIN Code</label>
                  <input
                    type="text"
                    defaultValue="400001"
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-cocoa">Country</label>
                  <input
                    type="text"
                    defaultValue="India"
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
            >
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
