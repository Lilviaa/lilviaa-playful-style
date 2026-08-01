import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from "@/lib/addresses-api";
import { Settings, MapPin, User, Shield, Key, Trash2, Edit2, Save, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUpdateProfile, useUpdatePassword } from "@/lib/profile-api";
import { useState } from "react";

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
  const { data: addresses = [], isLoading: isLoadingAddresses } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  if (!user) return null;

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const full_name = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    
    updateProfile.mutate({ full_name, phone }, {
      onSuccess: () => {
        setIsProfileOpen(false);
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const current_password = formData.get("current_password") as string;
    const new_password = formData.get("new_password") as string;
    const confirm_password = formData.get("confirm_password") as string;
    
    if (new_password !== confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    
    updatePassword.mutate({ current_password, new_password }, {
      onSuccess: () => {
        setIsPasswordOpen(false);
        e.currentTarget.reset();
      }
    });
  };

  const handleAddressSubmit = async (e: React.FormEvent<HTMLFormElement>, id?: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      type: formData.get("type") as string,
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      is_default: formData.get("is_default") === "on",
    };
    if (id) {
      updateAddress.mutate({ id, data });
    } else {
      createAddress.mutate(data);
    }
  };

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
              <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogTrigger asChild>
                  <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-cocoa">Edit Personal Information</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProfileSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Full Name</label>
                      <input type="text" name="full_name" required defaultValue={user.full_name} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
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
                      <input type="tel" name="phone" required defaultValue={user.phone || ""} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button type="submit" disabled={updateProfile.isPending} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-50">
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
                <p className="font-medium text-cocoa mt-1">{user.full_name || "Not provided"}</p>
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

          {/* ADDRESSES */}
          <div>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
              <h3 className="font-display text-lg text-cocoa flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Addresses ({addresses.length}/5)
              </h3>
              {addresses.length < 5 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add New
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl text-cocoa">Add New Address</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => handleAddressSubmit(e)} className="space-y-4 pt-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Address Type (e.g. Home, Work)</label>
                        <input required name="type" type="text" defaultValue="Home" className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-cocoa">Full Name</label>
                          <input type="text" name="full_name" required defaultValue={user.full_name} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-cocoa">Phone</label>
                          <input type="text" name="phone" required defaultValue={user.phone || ""} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Street Address</label>
                        <input type="text" name="address" required placeholder="123 Playful Lane" className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-cocoa">City</label>
                          <input type="text" name="city" required placeholder="Mumbai" className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-cocoa">State</label>
                          <input type="text" name="state" required placeholder="Maharashtra" className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-cocoa">PIN Code</label>
                          <input required name="zip" type="text" placeholder="400001" className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" name="is_default" id="is_default" className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2" />
                        <label htmlFor="is_default" className="text-sm font-medium text-cocoa">Set as default address</label>
                      </div>
                      <div className="pt-4 flex justify-between items-center">
                        <DialogTrigger asChild>
                          <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-cocoa">Cancel</button>
                        </DialogTrigger>
                        <button type="submit" disabled={createAddress.isPending} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                          <Save className="h-4 w-4" /> Save Address
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {isLoadingAddresses ? (
              <p className="text-sm text-muted-foreground">Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((address) => (
                  <div key={address.id} className="relative rounded-xl border-2 border-border bg-background p-4 flex flex-col">
                    {address.is_default && (
                      <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">Default</span>
                    )}
                    <h4 className="font-semibold text-cocoa mb-1">{address.type} <span className="text-muted-foreground font-normal text-sm ml-2">{address.full_name}</span></h4>
                    <div className="text-sm text-muted-foreground flex-1">
                      <p>{address.address}</p>
                      <p>{address.city}, {address.state} {address.zip}</p>
                      <p className="mt-1">Ph: {address.phone}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-sm font-semibold text-primary hover:underline">Edit</button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle className="font-display text-2xl text-cocoa">Edit Address</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => handleAddressSubmit(e, address.id)} className="space-y-4 pt-4">
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-cocoa">Address Type</label>
                              <input required name="type" type="text" defaultValue={address.type} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-cocoa">Full Name</label>
                                <input type="text" name="full_name" required defaultValue={address.full_name} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-cocoa">Phone</label>
                                <input type="text" name="phone" required defaultValue={address.phone} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-sm font-semibold text-cocoa">Street Address</label>
                              <input type="text" name="address" required defaultValue={address.address} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-cocoa">City</label>
                                <input type="text" name="city" required defaultValue={address.city} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-cocoa">State</label>
                                <input type="text" name="state" required defaultValue={address.state} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-cocoa">PIN Code</label>
                                <input required name="zip" type="text" defaultValue={address.zip} className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <input type="checkbox" name="is_default" id={`is_default_${address.id}`} defaultChecked={address.is_default} className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2" />
                              <label htmlFor={`is_default_${address.id}`} className="text-sm font-medium text-cocoa">Set as default address</label>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                              <DialogTrigger asChild>
                                <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-cocoa">Cancel</button>
                              </DialogTrigger>
                              <button type="submit" disabled={updateAddress.isPending} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                                <Save className="h-4 w-4" /> Save
                              </button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <button onClick={() => {
                        if (confirm("Are you sure you want to delete this address?")) {
                          deleteAddress.mutate(address.id);
                        }
                      }} className="text-sm font-semibold text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2 text-sm font-semibold text-cocoa hover:bg-sand transition-colors w-fit shrink-0">
                      <Key className="h-4 w-4" /> Update
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl text-cocoa">Update Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Current Password</label>
                        <input type="password" name="current_password" required className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">New Password</label>
                        <input type="password" name="new_password" required className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Confirm New Password</label>
                        <input type="password" name="confirm_password" required className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none" />
                      </div>
                      <div className="pt-4 flex justify-between items-center">
                        <DialogTrigger asChild>
                          <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-cocoa">
                            Cancel
                          </button>
                        </DialogTrigger>
                        <button type="submit" disabled={updatePassword.isPending} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-50">
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
