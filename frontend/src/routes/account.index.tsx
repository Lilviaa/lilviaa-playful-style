import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { MapPin, Package, User, Save, Edit2, CheckCircle2, Plus, Trash2, AlertCircle } from "lucide-react";
import { formatINR } from "@/lib/cart";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

type Address = {
  id: string;
  type: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  isDefault: boolean;
};

const defaultAddresses: Address[] = [
  {
    id: "1",
    type: "Home",
    street: "123 Playful Lane, Apt 4B",
    city: "Mumbai",
    state: "Maharashtra",
    pin: "400001",
    country: "India",
    isDefault: true,
  }
];

export const Route = createFileRoute("/account/")({
  component: AccountIndexPage,
});

const recentOrder = {
  id: "#LV-928374",
  date: "July 12, 2026",
  status: "Delivered",
  total: 2499,
  items: [
    { name: "Sunshine Linen Kurta", qty: 1, size: "2-3Y" },
    { name: "Playful Prints Shirt", qty: 2, size: "3-4Y" }
  ]
};

function AccountIndexPage() {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses);
  const [addressView, setAddressView] = useState<"list" | "edit" | "add">("list");
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Profile updated successfully");
    setIsProfileOpen(false);
  }

  function handleAddressSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAddr: Address = {
      id: addressView === "edit" && editingAddress ? editingAddress.id : Date.now().toString(),
      type: (formData.get("type") as string) || "Home",
      street: formData.get("street") as string,
      landmark: formData.get("landmark") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pin: formData.get("pin") as string,
      country: formData.get("country") as string,
      isDefault: addresses.length === 0 ? true : (addressView === "edit" && editingAddress ? editingAddress.isDefault : false),
    };

    if (addressView === "edit" && editingAddress) {
      setAddresses(addresses.map(a => a.id === editingAddress.id ? newAddr : a));
      toast.success("Address updated successfully");
    } else {
      setAddresses([...addresses, newAddr]);
      toast.success("Address added successfully");
    }
    
    setAddressView("list");
  }

  function handleSetDefault(id: string) {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
    toast.success("Default address updated");
  }

  function handleDeleteAddress(id: string) {
    const updated = addresses.filter(a => a.id !== id);
    if (updated.length > 0 && !updated.find(a => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    toast.success("Address deleted successfully");
  }

  const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

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
                      defaultValue={user.phone || ""}
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
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
                <button onClick={() => {
                  toast.success("Verification link sent to email!");
                  setTimeout(() => {
                    const otp = prompt("Enter the verification code sent to your email:");
                    if(otp) toast.success("Email verified successfully!");
                  }, 800);
                }} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Verify
                </button>
              </div>
              <p className="font-medium text-cocoa mt-0.5">{user.email}</p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</p>
                <button onClick={() => {
                  toast.success("OTP sent to phone!");
                  setTimeout(() => {
                    const otp = prompt("Enter the OTP sent to your phone:");
                    if(otp) toast.success("Phone verified successfully!");
                  }, 800);
                }} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Verify
                </button>
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
                  <div className="space-y-4 pt-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className={`p-4 rounded-xl border-2 ${addr.isDefault ? 'border-primary bg-primary/5' : 'border-border bg-background'} flex justify-between items-start gap-4`}>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-cocoa">{addr.type}</span>
                            {addr.isDefault && <span className="bg-primary text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-muted-foreground">{addr.street}</p>
                          {addr.landmark && <p className="text-muted-foreground">{addr.landmark}</p>}
                          <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.pin}</p>
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
                          {!addr.isDefault && (
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
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Address Type (e.g. Home, Work)</label>
                      <input
                        name="type"
                        required
                        type="text"
                        defaultValue={addressView === "edit" ? editingAddress?.type : ""}
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Street Address</label>
                      <input
                        name="street"
                        required
                        type="text"
                        defaultValue={addressView === "edit" ? editingAddress?.street : ""}
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-cocoa">Landmark (Optional)</label>
                      <input
                        name="landmark"
                        type="text"
                        defaultValue={addressView === "edit" ? editingAddress?.landmark : ""}
                        placeholder="e.g. Opposite Central Mall"
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
                        <label className="text-sm font-semibold text-cocoa">PIN Code</label>
                        <input
                          name="pin"
                          required
                          type="text"
                          defaultValue={addressView === "edit" ? editingAddress?.pin : ""}
                          className="w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm text-cocoa focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-cocoa">Country</label>
                        <input
                          name="country"
                          required
                          type="text"
                          defaultValue={addressView === "edit" ? editingAddress?.country : ""}
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
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
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
                <p className="font-medium">{defaultAddr.type}</p>
                <p className="text-muted-foreground">{defaultAddr.street}</p>
                {defaultAddr.landmark && <p className="text-muted-foreground">{defaultAddr.landmark}</p>}
                <p className="text-muted-foreground">{defaultAddr.city}, {defaultAddr.state} {defaultAddr.pin}</p>
                <p className="text-muted-foreground">{defaultAddr.country}</p>
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
        
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold text-cocoa">{recentOrder.id}</p>
              <p className="text-xs text-muted-foreground">{recentOrder.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-cocoa">{formatINR(recentOrder.total)}</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                recentOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-butter text-primary'
              }`}>
                {recentOrder.status}
              </span>
            </div>
          </div>
          
          <ul className="mt-4 space-y-2">
            {recentOrder.items.map((item, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-cocoa">
                  <span className="font-medium">{item.qty}x</span> {item.name} <span className="text-muted-foreground">(Size: {item.size})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
