import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Package, Truck, FileText, Star, ArrowRight, MapPin, CheckCircle2, Loader2, PackageCheck, XCircle, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/cart";
import { formatOrderId } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";


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

  const fetchOrders = () => {
    if (user) {
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
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);



  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="flex items-center gap-2 font-display text-2xl text-cocoa">
          <Package className="h-6 w-6 text-primary" /> Order History
        </h2>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-card p-6 shadow-cute md:p-8 flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl bg-card p-6 shadow-cute md:p-8 text-center py-12">
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const statusFormatted = (order.tracking_status || order.status || "Pending").replace(/_/g, " ");
            const isDelivered = (order.tracking_status || order.status)?.toLowerCase().includes('deliver');
            const isShippedOrDelivered = isDelivered || (order.tracking_status || order.status)?.toLowerCase().includes('ship');
            
            return (
              <div key={order.id} className="rounded-3xl bg-card p-6 shadow-cute md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-semibold text-cocoa">{order.display_id || formatOrderId(order.id)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cocoa">{formatINR(order.total_amount)}</p>
                  <div className="flex flex-col items-end gap-1 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                      isDelivered ? 'bg-green-100 text-green-800' : 'bg-butter text-primary'
                    }`}>
                      {statusFormatted}
                    </span>
                    {(order.awb_code || order.tracking_number) && (
                      <p className="text-xs text-muted-foreground font-mono bg-sand/30 px-2 py-0.5 rounded border border-cocoa/5">
                        Tracking: {order.awb_code || order.tracking_number}
                      </p>
                    )}
                  </div>
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
                <a
                  href={`/invoice/${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:bg-sand"
                >
                  <FileText className="h-4 w-4" /> View Invoice
                </a>

                {isShippedOrDelivered && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:bg-sand">
                        <Star className="h-4 w-4" /> Write Review
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review Items from {order.display_id || formatOrderId(order.id)}</DialogTitle>
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

      {orders.length > 0 && (
        <div className="mt-8 text-center pt-4">
          <Link to="/shop" className="inline-flex items-center justify-center rounded-full bg-butter px-6 py-3 text-sm font-bold text-cocoa shadow-sm hover:bg-sand transition-colors">
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
