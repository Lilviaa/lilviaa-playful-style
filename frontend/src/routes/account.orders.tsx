import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Package, Truck, FileText, Star, Download, MapPin, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/cart";

export const Route = createFileRoute("/account/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — lilviaa" },
    ],
  }),
  component: AccountOrdersPage,
});

const dummyOrders = [
  {
    id: "#LV-928374",
    date: "July 12, 2026",
    status: "Delivered",
    total: 2499,
    items: [
      { name: "Sunshine Linen Kurta", qty: 1, size: "2-3Y", image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=200&h=200&fit=crop" },
      { name: "Playful Prints Shirt", qty: 2, size: "3-4Y", image: "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?w=200&h=200&fit=crop" }
    ]
  },
  {
    id: "#LV-482910",
    date: "July 16, 2026",
    status: "Processing",
    total: 1299,
    items: [
      { name: "Festive Silk Set", qty: 1, size: "4-5Y", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=200&h=200&fit=crop" }
    ]
  },
  {
    id: "#LV-102945",
    date: "June 05, 2026",
    status: "Delivered",
    total: 3150,
    items: [
      { name: "Midnight Leaf Mandarin Kurta", qty: 1, size: "5-6Y", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200&h=200&fit=crop" },
      { name: "Sunny Picnic Shirt", qty: 1, size: "5-6Y", image: "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=200&h=200&fit=crop" },
      { name: "Blossom Blush Frock", qty: 1, size: "1-2Y", image: "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?w=200&h=200&fit=crop" }
    ]
  }
];

function AccountOrdersPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-card p-6 shadow-cute md:p-8">
        <h2 className="flex items-center gap-2 font-display text-2xl text-cocoa mb-6">
          <Package className="h-6 w-6 text-primary" /> Order History
        </h2>

        <div className="space-y-6">
          {dummyOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-semibold text-cocoa">{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cocoa">{formatINR(order.total)}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-butter text-primary'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 mt-4">
                <div className="flex-1">
                  <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-cocoa">
                          <span className="font-medium">{item.qty}x</span> {item.name} <span className="text-muted-foreground">(Size: {item.size})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {order.items.map((item, idx) => (
                    <img key={idx} src={item.image} alt={item.name} className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl border border-border shadow-sm" />
                  ))}
                </div>
              </div>
              
              <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5">
                      <Truck className="h-4 w-4" /> Track Package
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Track Package: {order.id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center mt-1">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <div className="w-0.5 h-12 bg-primary my-1" />
                        </div>
                        <div>
                          <p className="font-bold text-cocoa">Order Placed</p>
                          <p className="text-sm text-muted-foreground">We have received your order.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center mt-1">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <div className="w-0.5 h-12 bg-border my-1" />
                        </div>
                        <div>
                          <p className="font-bold text-cocoa">Shipped</p>
                          <p className="text-sm text-muted-foreground">Your package is on the way.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center mt-1">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-muted-foreground">Out for Delivery</p>
                          <p className="text-sm text-muted-foreground">Expected by tomorrow, 9 PM.</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:bg-sand">
                      <FileText className="h-4 w-4" /> View Invoice
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invoice for {order.id}</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground opacity-50" />
                      <p className="text-cocoa font-medium">Your invoice is ready to download.</p>
                      <button className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground shadow-pop mt-2">
                        <Download className="h-4 w-4" /> Download PDF
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>

                {order.status === 'Delivered' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:bg-sand">
                        <Star className="h-4 w-4" /> Write Review
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review {order.id}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-semibold text-cocoa">Rate your experience</label>
                          <div className="flex gap-2 mt-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className="h-8 w-8 text-butter hover:fill-butter cursor-pointer transition-colors" />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-cocoa">Tell us more</label>
                          <textarea 
                            className="w-full mt-2 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-cocoa focus:border-primary focus:outline-none min-h-[100px]"
                            placeholder="What did you love about these items?"
                          />
                        </div>
                        <button className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop">
                          Submit Review
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center border-t border-border pt-8">
          <Link to="/shop" className="inline-flex items-center justify-center rounded-full bg-butter px-6 py-3 text-sm font-bold text-cocoa shadow-sm hover:bg-sand transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
