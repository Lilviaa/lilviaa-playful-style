import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Package, Truck, FileText, Star, ArrowRight, MapPin, CheckCircle2, Loader2, PackageCheck, XCircle, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR } from "@/lib/cart";
import { formatOrderId } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function TrackingTimeline({ status, trackingStatus, trackingHistory, loading, onRefresh, awbCode, courier }: { 
  status: string; 
  trackingStatus?: string;
  trackingHistory?: any[];
  loading?: boolean;
  onRefresh?: () => void;
  awbCode?: string;
  courier?: string;
}) {
  const steps = [
    { id: "placed", label: "Order Placed", desc: "We have received your order.", icon: CheckCircle2 },
    { id: "shipped", label: "Shipped", desc: "Your package is on the way.", icon: Truck },
    { id: "out_for_delivery", label: "Out for Delivery", desc: "Expected to arrive soon.", icon: MapPin },
    { id: "delivered", label: "Delivered", desc: "Your package has been delivered.", icon: PackageCheck }
  ];

  let targetIndex = 0;
  
  // Map Shiprocket Status if available
  const ts = (trackingStatus || status || "").toLowerCase();
  if (ts.includes("cancel") || ts === "rto") targetIndex = -1;
  else if (ts.includes("deliver")) targetIndex = 3;
  else if (ts.includes("out for") || ts.includes("out_for")) targetIndex = 2;
  else if (ts.includes("ship") || ts.includes("transit") || ts.includes("pick")) targetIndex = 1;
  else targetIndex = 0;

  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (targetIndex === -1) {
      setActiveStep(-1);
      return;
    }
    setActiveStep(0);
    let current = 0;
    const interval = setInterval(() => {
      if (current < targetIndex) {
        current++;
        setActiveStep(current);
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [targetIndex]);

  if (targetIndex === -1) {
    return (
      <div className="py-8 text-center space-y-4">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <p className="text-lg font-bold text-cocoa">Order Cancelled</p>
        <p className="text-muted-foreground">This order has been cancelled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 px-2">
      <div className="flex justify-between items-center bg-sand/30 p-3 rounded-xl border border-cocoa/10">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Courier Partner</p>
          <p className="font-bold text-cocoa">{courier || "Pending Assignment"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tracking Number</p>
          <p className="font-mono font-bold text-cocoa">{awbCode || "N/A"}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-2">
        <h4 className="font-bold text-cocoa">Tracking Timeline</h4>
        {awbCode && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="h-8 gap-1 rounded-full border-cocoa/20">
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      <div className="space-y-0 py-2">
        {steps.map((step, idx) => {
          const isCompleted = idx <= activeStep;
          const isCurrent = idx === activeStep;
          const isLast = idx === steps.length - 1;
          const isLineCompleted = idx < activeStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center mt-1">
                <div className={`flex items-center justify-center rounded-full bg-background transition-all duration-500 ease-in-out ${isCompleted ? "text-primary scale-110" : "text-muted-foreground scale-100 opacity-50"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {!isLast && (
                  <div className="relative w-0.5 h-14 my-1 bg-border rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 w-full bg-primary transition-all duration-[600ms] ease-linear" style={{ height: isLineCompleted ? "100%" : (isCurrent && idx < targetIndex ? "100%" : "0%") }} />
                  </div>
                )}
              </div>
              <div className={`pb-8 transition-all duration-500 ${isCompleted ? "opacity-100 translate-x-0" : "opacity-40 -translate-x-2"}`}>
                <p className={`font-bold ${isCompleted ? "text-cocoa" : "text-muted-foreground"}`}>{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {trackingHistory && trackingHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-cocoa/10">
          <h4 className="font-bold text-cocoa mb-4">Detailed Activity</h4>
          <div className="space-y-4">
            {trackingHistory.map((act: any, i: number) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-cocoa">{act.activity || act.status}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {act.date} {act.time && `at ${act.time}`} {act.location && `• ${act.location}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

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

  const refreshTracking = async (orderId: string) => {
    setRefreshingId(orderId);
    try {
      const res = await apiFetch(`/orders/${orderId}/refresh-tracking`, { method: "POST" });
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingId(null);
    }
  };

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
            
            return (
              <div key={order.id} className="rounded-3xl bg-card p-6 shadow-cute md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-semibold text-cocoa">{formatOrderId(order.id)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cocoa">{formatINR(order.total_amount)}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
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
                {order.status !== 'cancelled' && (
                  <Dialog onOpenChange={(open) => { if (open && order.awb_code) refreshTracking(order.id) }}>
                    <DialogTrigger asChild>
                      <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5">
                        <Truck className="h-4 w-4" /> Track Package
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Track Package: {order.awb_code || order.tracking_number || formatOrderId(order.id)}</DialogTitle>
                      </DialogHeader>
                      <TrackingTimeline 
                        status={order.status} 
                        trackingStatus={order.tracking_status}
                        trackingHistory={order.tracking_history}
                        awbCode={order.awb_code || order.tracking_number}
                        courier={order.courier_name}
                        loading={refreshingId === order.id}
                        onRefresh={() => refreshTracking(order.id)}
                      />
                    </DialogContent>
                  </Dialog>
                )}

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
                        <DialogTitle>Review Items from {formatOrderId(order.id)}</DialogTitle>
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
