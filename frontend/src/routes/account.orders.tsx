import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Package, Truck, FileText, Star, Download, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/cart";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/account/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — lilviaa" },
    ],
  }),
  component: AccountOrdersPage,
});


function AccountOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      apiFetch("/orders/me")
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-card p-6 shadow-cute md:p-8">
        <h2 className="flex items-center gap-2 font-display text-2xl text-cocoa mb-6">
          <Package className="h-6 w-6 text-primary" /> Order History
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusFormatted = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending";
              const isDelivered = order.status === 'delivered';
              
              return (
            <div key={order.id} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-semibold text-cocoa">#{order.id.split('-')[0].toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cocoa">{formatINR(order.total_amount)}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isDelivered ? 'bg-green-100 text-green-800' : 'bg-butter text-primary'
                  }`}>
                    {statusFormatted}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 mt-4">
                <div className="flex-1">
                  <ul className="space-y-3">
                    {order.order_items?.map((item: any) => {
                      const variant = item.product_variants;
                      const product = variant?.products;
                      return (
                        <li key={item.id} className="flex justify-between text-sm">
                          <span className="text-cocoa">
                            <span className="font-medium">{item.quantity}x</span> {product?.name || 'Product'} <span className="text-muted-foreground">(Size: {variant?.size})</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {order.order_items?.map((item: any) => {
                    const imgUrl = item.product_variants?.products?.image_urls?.[0];
                    return imgUrl ? (
                      <img key={item.id} src={imgUrl} alt="Product" className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl border border-border shadow-sm" />
                    ) : null;
                  })}
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
                      <DialogTitle>Invoice for #{order.id.split('-')[0].toUpperCase()}</DialogTitle>
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

                {isDelivered && (
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
            )})}
          </div>
        )}

        <div className="mt-8 text-center border-t border-border pt-8">
          <Link to="/shop" className="inline-flex items-center justify-center rounded-full bg-butter px-6 py-3 text-sm font-bold text-cocoa shadow-sm hover:bg-sand transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
