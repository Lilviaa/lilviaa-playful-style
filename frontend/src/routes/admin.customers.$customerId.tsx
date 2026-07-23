import { createFileRoute, Link } from "@tanstack/react-router";
import { useCustomer } from "@/lib/admin/customers-api";
import { useProducts } from "@/lib/admin/products-api";
import { ChevronLeft, User, Mail, Phone, CalendarDays } from "lucide-react";
import { formatINR } from "@/lib/cart";
import { CustomerTags } from "@/components/admin/customers/customer-tags";
import { CustomerAddresses } from "@/components/admin/customers/customer-addresses";
import { CustomerOrderHistory } from "@/components/admin/customers/customer-order-history";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/customers/$customerId")({
  component: CustomerProfilePage,
});

function CustomerProfilePage() {
  const { customerId } = Route.useParams();
  const { data: customer, isLoading } = useCustomer(customerId);
  const { data: allProducts } = useProducts();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading customer profile...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-muted-foreground">Customer not found.</div>;
  }

  // Mock wishlist items using real products for the sake of the admin UI preview
  const mockWishlistItems = (allProducts || []).slice(0, 2).map((p) => ({
    slug: p.slug,
    name: p.name,
    price: p.base_price,
    image: p.images?.[0]?.url || "/placeholder.jpg"
  }));

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/customers"
          className="p-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground hover:text-cocoa"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa capitalize">
            Customer Profile
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Addresses */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-cocoa/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-sand to-cocoa/10" />

            <div className="relative pt-12 text-center">
              <div className="h-20 w-20 bg-cocoa text-white rounded-full mx-auto flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm">
                {customer.name.charAt(0).toUpperCase()}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold text-cocoa">{customer.name}</h2>
                  {customer.is_guest && (
                    <Badge variant="outline" className="text-[10px] h-5 bg-slate-50">
                      Guest
                    </Badge>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-cocoa/10">
              <h3 className="text-sm font-semibold text-cocoa mb-3">Customer Tags</h3>
              <CustomerTags customerId={customer.id} tags={customer.tags} />
            </div>

            <div className="mt-6 pt-6 border-t border-cocoa/10 flex divide-x divide-cocoa/10 text-center">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-cocoa">{customer.total_orders || 0}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Lifetime Value</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatINR(customer.total_spend || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-2xl p-6 border border-cocoa/10 shadow-sm">
            <h3 className="font-semibold text-cocoa mb-4 text-lg">Saved Addresses</h3>
            <CustomerAddresses customerId={customer.id} />
          </div>
        </div>

        {/* Right Column: Order History & Wishlist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order History */}
          <div className="bg-white rounded-2xl p-6 border border-cocoa/10 shadow-sm">
            <h3 className="font-semibold text-cocoa mb-4 text-lg">Order History</h3>
            <CustomerOrderHistory customerEmail={customer.email} />
          </div>

          {/* Wishlist Insights */}
          <div className="bg-white rounded-2xl p-6 border border-cocoa/10 shadow-sm">
            <h3 className="font-semibold text-cocoa mb-4 text-lg">Wishlist Insights</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Items this customer has added to their wishlist. Use this for targeted cross-selling
              or personalized discounts.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockWishlistItems.map((product) => (
                <div key={product.slug} className="rounded-xl overflow-hidden border border-cocoa/10 shadow-sm">
                  <div className="aspect-square bg-sand overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-cocoa truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatINR(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
