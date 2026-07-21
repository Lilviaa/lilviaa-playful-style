import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Settings, MapPin, User, Shield, Key, Trash2, Edit2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-card p-6 shadow-cute md:p-8">
        <h2 className="flex items-center gap-2 font-display text-2xl text-cocoa mb-6">
          <Settings className="h-6 w-6 text-primary" /> Account Settings
        </h2>

        <div className="space-y-10 max-w-3xl">
          
          {/* PERSONAL INFORMATION */}
          <div>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
              <h3 className="font-display text-lg text-cocoa flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-cocoa">Edit Personal Information</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); toast.success("Information updated"); }} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Full Name</label>
                      <input type="text" defaultValue={user.name} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Email Address</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        disabled
                        title="Email address cannot be changed here"
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa opacity-60 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Phone Number</label>
                      <input type="tel" defaultValue={user.phone || ""} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5">
                        <Save className="h-4 w-4" /> Save Changes
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</p>
                <p className="font-medium text-cocoa mt-1">{user.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Email Address</p>
                <p className="font-medium text-cocoa mt-1">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</p>
                <p className="font-medium text-cocoa mt-1">{user.phone || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* DEFAULT ADDRESS */}
          <div>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
              <h3 className="font-display text-lg text-cocoa flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Default Address
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-cocoa">Edit Default Address</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); toast.success("Address updated"); }} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Address Type (e.g. Home, Work)</label>
                      <input
                        required
                        type="text"
                        defaultValue="Home"
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Street Address</label>
                      <input type="text" required defaultValue="123 Playful Lane, Apt 4B" className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Landmark (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Opposite Central Mall"
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">City</label>
                        <input type="text" required defaultValue="Mumbai" className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">State</label>
                        <input type="text" required defaultValue="Maharashtra" className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">PIN Code</label>
                        <input
                          required
                          type="text"
                          defaultValue="400001"
                          className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Country</label>
                        <input
                          required
                          type="text"
                          defaultValue="India"
                          className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-between items-center">
                      <DialogTrigger asChild>
                        <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-cocoa">
                          Cancel
                        </button>
                      </DialogTrigger>
                      <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5">
                        <Save className="h-4 w-4" /> Save Address
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="text-sm">
              <p className="font-medium text-cocoa">123 Playful Lane, Apt 4B</p>
              <p className="text-muted-foreground mt-0.5">Mumbai, Maharashtra 400001</p>
              <p className="text-muted-foreground mt-0.5">India</p>
            </div>
          </div>

          {/* SECURITY */}
          <div>
            <h3 className="font-display text-lg text-cocoa border-b border-border pb-2 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security
            </h3>
            
            <div className="divide-y divide-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                <div>
                  <h4 className="font-semibold text-cocoa">Password</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Update your password to keep your account secure.</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2 text-sm font-semibold text-cocoa hover:bg-sand transition-colors w-fit shrink-0">
                      <Key className="h-4 w-4" /> Update
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl text-cocoa">Update Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); toast.success("Password updated successfully"); }} className="space-y-4 pt-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Current Password</label>
                        <input type="password" required className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">New Password</label>
                        <input type="password" required className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Confirm New Password</label>
                        <input type="password" required className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="pt-4 flex justify-between items-center">
                        <DialogTrigger asChild>
                          <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-cocoa">
                            Cancel
                          </button>
                        </DialogTrigger>
                        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5">
                          <Save className="h-4 w-4" /> Update Password
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                <div>
                  <h4 className="font-semibold text-red-700">Delete Account</h4>
                  <p className="text-sm text-red-600/80 mt-0.5">Permanently remove your account and all associated data.</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700 px-5 py-2 text-sm font-semibold hover:bg-red-100 transition-colors w-fit shrink-0">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl text-red-700">Delete Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-cocoa">Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.</p>
                      <div className="pt-4 flex justify-between items-center">
                        <DialogTrigger asChild>
                          <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-cocoa">
                            Cancel
                          </button>
                        </DialogTrigger>
                        <button onClick={() => toast.success("Account deletion initiated")} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-pop transition-transform hover:-translate-y-0.5">
                          <Trash2 className="h-4 w-4" /> Yes, Delete
                        </button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
