import { OrderFilters as OrderFiltersType } from "@/lib/admin/orders-api";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onChange: (filters: OrderFiltersType) => void;
}

export function OrderFilters({ filters, onChange }: OrderFiltersProps) {
  const navigate = useNavigate();

  const handleStatusChange = (val: string) => {
    onChange({ ...filters, status: val });

    // Also update URL so it can be shared or refreshed
    navigate({
      search: (old: any) => ({ ...old, status: val === "all" ? undefined : val }),
      replace: true,
    });
  };

  const handlePaymentMethodChange = (val: string) => {
    onChange({ ...filters, paymentMethod: val });
  };

  const handleSearchChange = (val: string) => {
    onChange({ ...filters, search: val });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Order ID, Customer, or Phone..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 rounded-full border-cocoa/20 bg-white focus-visible:ring-primary h-10"
        />
      </div>

      <div className="flex gap-2">
        <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px] rounded-full bg-white border-cocoa/20">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.paymentMethod || "all"} onValueChange={handlePaymentMethodChange}>
          <SelectTrigger className="w-[160px] rounded-full bg-white border-cocoa/20">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cod">Cash on Delivery</SelectItem>
            <SelectItem value="razorpay">Razorpay</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
