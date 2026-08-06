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
      // Append a cache-busting timestamp to prevent the browser from serving cached requests
      // from a previous user's session
      apiFetch(`/orders/me?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      // Clear state when user is null (e.g. on logout)
      setOrders([]);
      setLoading(true);
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
                      <DialogTitle>Track Package: {order.tracking_number || `ORD-LV-${parseInt(order.id.replace(/-/g, '').substring(0, 6), 16).toString().padStart(6, '0')}`}</DialogTitle>
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
                          <div className="w-0.5 h-12 bg-border my-1" />
                        </div>
                        <div>
                          <p className="font-bold text-muted-foreground">Out for Delivery</p>
                          <p className="text-sm text-muted-foreground">Expected by tomorrow, 9 PM.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center mt-1">
                          <div className="h-5 w-5 rounded-full border-2 border-muted/50 flex items-center justify-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-transparent" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-muted-foreground">Delivered</p>
                          <p className="text-sm text-muted-foreground">Pending delivery confirmation.</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <a
                  href={`/invoice/${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:bg-sand"
                >
                  <FileText className="h-4 w-4" /> View Invoice
                </a>

                {isDelivered && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:bg-sand">
                        <Star className="h-4 w-4" /> Write Review
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review Items from #{order.id.split('-')[0].toUpperCase()}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">Select an item to write a review on its product page:</p>
                        <div className="flex flex-col gap-3">
                          {order.order_items?.map((item: any) => {
                            const product = item.product_variants?.products;
                            if (!product) return null;
                            return (
                              <Link 
                                key={item.id} 
                                to={`/products/${product.slug}`}
                                className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-sand transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {product.image_urls?.[0] && (
                                    <img src={product.image_urls[0]} alt="" className="h-10 w-10 rounded-md object-cover" />
                                  )}
                                  <span className="font-semibold text-cocoa">{product.name}</span>
                                </div>
                                <span className="text-sm font-bold text-primary flex items-center gap-1">Review <ArrowRight className="h-3 w-3" /></span>
                              </Link>
                            );
                          })}
                        </div>
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
