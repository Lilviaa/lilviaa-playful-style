import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { MapPin, Package, User, Save, Edit2, CheckCircle2, Plus, Trash2, AlertCircle } from "lucide-react";
import { formatINR } from "@/lib/cart";
import { useState, useEffect } from "react";
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, type Address } from "@/lib/addresses-api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useUpdateProfile } from "@/lib/profile-api";

export const Route = createFileRoute("/account/")({
  component: AccountIndexPage,
});

function AccountIndexPage() {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);

  const { data: addresses = [] } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const updateProfile = useUpdateProfile();
  
  const [addressView, setAddressView] = useState<"list" | "edit" | "add">("list");
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    if (user) {
      apiFetch(`/orders/me?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setRecentOrder(data[0]);
          }
          setLoadingOrder(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingOrder(false);
        });
    } else {
      setRecentOrder(null);
      setLoadingOrder(true);
    }
  }, [user]);

  function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const full_name = formData.get("full_name") as string;
    const phone = formData.get("phone") as string;
    
    updateProfile.mutate({ full_name, phone }, {
      onSuccess: () => {
        setIsProfileOpen(false);
      }
    });
  }

  function handleAddressSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      type: "Home",
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      is_default: addresses.length === 0 ? true : (addressView === "edit" && editingAddress ? editingAddress.is_default : false),
    };

    if (addressView === "edit" && editingAddress) {
      updateAddress.mutate({ id: editingAddress.id, data });
    } else {
      createAddress.mutate(data);
    }
    
    setAddressView("list");
  }

  function handleSetDefault(id: string) {
    updateAddress.mutate({ id, data: { is_default: true } });
  }

  function handleDeleteAddress(id: string) {
    deleteAddress.mutate(id);
  }

  const defaultAddr = addresses.find(a => a.is_default) || addresses[0];

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-cute">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-display text-xl text-cocoa">
              <User className="h-5 w-5 text-primary" /> Profile Overview
            </h2>
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DialogTrigger asChild>
                <button className="text-sm font-semibold text-primary hover:underline">
                  Edit
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl text-cocoa">Edit Profile</DialogTitle>
                </DialogHeader>
                  <form onSubmit={handleProfileSave} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        required
                        defaultValue={user.full_name}
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                      />
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
                      <input
                        type="tel"
                        name="phone"
                        required
                        pattern="^(\+91\s)?[0-9]{10}$"
                        title="Phone must be 10 digits, or +91 followed by 10 digits"
                        defaultValue={user.phone || ""}
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" /> Save Changes
                      </button>
                    </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</p>
              <p className="font-medium text-cocoa mt-0.5">{user.full_name || "Not provided"}</p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Email Address</p>
              </div>
              <p className="font-medium text-cocoa mt-0.5">{user.email}</p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</p>
              </div>
              <p className="font-medium text-cocoa mt-0.5">{user.phone || "Not provided"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-cute">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-display text-xl text-cocoa">
              <MapPin className="h-5 w-5 text-primary" /> Default Address
            </h2>
            <Dialog open={isAddressOpen} onOpenChange={(val) => { setIsAddressOpen(val); if(!val) setAddressView("list"); }}>
              <DialogTrigger asChild>
                <button className="text-sm font-semibold text-primary hover:underline">
                  Manage
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl text-cocoa">
                    {addressView === "list" ? "Manage Addresses" : addressView === "edit" ? "Edit Address" : "Add New Address"}
                  </DialogTitle>
                </DialogHeader>

                {addressView === "list" ? (
                  <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                    {addresses.map(addr => (
                      <div key={addr.id} className={`p-4 rounded-xl border-2 ${addr.is_default ? 'border-primary bg-primary/5' : 'border-border bg-background'} flex justify-between items-start gap-4`}>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-cocoa">{addr.full_name}</span>
                            {addr.is_default && <span className="bg-primary text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-muted-foreground">{addr.phone}</p>
                          <p className="text-muted-foreground">{addr.address}</p>
                          <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
                        </div>
                        <div className="flex flex-col gap-3 items-end">
                          <button 
                            onClick={() => { setEditingAddress(addr); setAddressView("edit"); }}
                            className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-red-500 hover:underline text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                          {!addr.is_default && (
                            <button onClick={() => handleSetDefault(addr.id)} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {addresses.length < 3 && (
                      <button
                        onClick={() => { setEditingAddress(null); setAddressView("add"); }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary text-primary font-semibold hover:bg-primary/5 transition-colors mt-2"
                      >
                        <Plus className="h-4 w-4" /> Add New Address
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleAddressSave} className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Full Name</label>
                        <input
                          name="full_name"
                          required
                          type="text"
                          defaultValue={addressView === "edit" ? editingAddress?.full_name : ""}
                          className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Phone</label>
                        <input
                          name="phone"
                          required
                          type="tel"
                          pattern="^(\+91\s)?[0-9]{10}$"
                          title="Phone must be 10 digits, or +91 followed by 10 digits"
                          defaultValue={addressView === "edit" ? editingAddress?.phone : ""}
                          className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Address</label>
                      <input
                        name="address"
                        required
                        type="text"
                        defaultValue={addressView === "edit" ? editingAddress?.address : ""}
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">City</label>
                        <input
                          name="city"
                          required
                          type="text"
                          defaultValue={addressView === "edit" ? editingAddress?.city : ""}
                          className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">State</label>
                        <input
                          name="state"
                          required
                          type="text"
                          defaultValue={addressView === "edit" ? editingAddress?.state : ""}
                          className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">ZIP / Postal Code</label>
                        <input
                          name="zip"
                          required
                          type="text"
                          defaultValue={addressView === "edit" ? editingAddress?.zip : ""}
                          className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-between items-center">
                      <button 
                        type="button" 
                        onClick={() => setAddressView("list")} 
                        className="text-sm font-semibold text-muted-foreground hover:text-cocoa"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createAddress.isPending || updateAddress.isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" /> Save Address
                      </button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1 text-sm text-cocoa">
            {defaultAddr ? (
              <>
                <p className="font-medium">{defaultAddr.full_name}</p>
                <p className="text-muted-foreground">{defaultAddr.phone}</p>
                <p className="text-muted-foreground">{defaultAddr.address}</p>
                <p className="text-muted-foreground">{defaultAddr.city}, {defaultAddr.state} {defaultAddr.zip}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No addresses saved.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-cute">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 font-display text-2xl text-cocoa">
            <Package className="h-6 w-6 text-primary" /> Recent Order
          </h2>
          <Link to="/account/orders" className="text-sm font-semibold text-primary hover:underline">
            View All Orders
          </Link>
        </div>
        
        {loadingOrder ? (
          <div className="rounded-2xl border border-border bg-background p-5 text-center text-muted-foreground text-sm">
            Loading recent order...
          </div>
        ) : recentOrder ? (
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-sm font-semibold text-cocoa">
                  {recentOrder.id.split("-")[0].toUpperCase()}-{recentOrder.id.split("-")[4].toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(recentOrder.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-cocoa">{formatINR(recentOrder.total_amount)}</p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  recentOrder.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-butter text-primary'
                }`}>
                  <span className="capitalize">{recentOrder.status}</span>
                </span>
              </div>
            </div>
            
            <ul className="mt-4 space-y-2">
              {recentOrder.order_items?.map((item: any, idx: number) => {
                const product = item.product_variants?.products;
                const variant = item.product_variants;
                return (
                  <li key={item.id || idx} className="flex justify-between text-sm">
                    <span className="text-cocoa">
                      <span className="font-medium">{item.quantity}x</span> {product?.name || "Product"} <span className="text-muted-foreground">(Size: {variant?.size || "N/A"})</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-background p-5 text-center text-muted-foreground text-sm">
            No recent orders found.
          </div>
        )}
      </div>
    </div>
  );
}
