import { useCustomerAddresses } from "@/lib/admin/customers-api";
import { MapPin, Home, Briefcase, Star } from "lucide-react";

interface CustomerAddressesProps {
  customerId: string;
}

export function CustomerAddresses({ customerId }: CustomerAddressesProps) {
  const { data: addresses, isLoading } = useCustomerAddresses(customerId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading addresses...</div>;
  }

  if (!addresses?.length) {
    return (
      <div className="rounded-xl border border-dashed border-cocoa/20 p-8 text-center text-muted-foreground bg-sand/10">
        <MapPin className="mx-auto h-8 w-8 mb-2 opacity-20" />
        <p>No addresses saved</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {addresses.map((addr) => {
        const isHome = addr.label.toLowerCase() === "home";
        const isWork = addr.label.toLowerCase() === "work";
        const Icon = isHome ? Home : isWork ? Briefcase : MapPin;

        return (
          <div
            key={addr.id}
            className={`relative p-5 rounded-xl border transition-all ${
              addr.is_default
                ? "border-cocoa bg-sand/20 shadow-sm"
                : "border-cocoa/10 bg-white hover:border-cocoa/30 hover:shadow-sm"
            }`}
          >
            {addr.is_default && (
              <div className="absolute top-3 right-3 text-amber-500 flex items-center gap-1 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Star className="h-3 w-3 fill-amber-500" />
                Default
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <div
                className={`p-2 rounded-lg ${addr.is_default ? "bg-cocoa text-white" : "bg-slate-100 text-slate-600"}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-cocoa">{addr.label}</h4>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {addr.full_address.address}
              <br />
              {addr.full_address.city}, {addr.full_address.state}
              <br />
              {addr.full_address.zip}
            </p>
          </div>
        );
      })}
    </div>
  );
}
