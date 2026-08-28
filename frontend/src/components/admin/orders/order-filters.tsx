import { useState, useEffect } from "react";
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

  const [localSearch, setLocalSearch] = useState(filters.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onChange({ ...filters, search: localSearch });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, filters, onChange]);

  useEffect(() => {
    if (filters.search !== localSearch) {
      setLocalSearch(filters.search || "");
    }
  }, [filters.search]);

  // Default timeframe to "recent" if nothing is provided
  useEffect(() => {
    if (!filters.timeframe && !filters.date) {
      onChange({ ...filters, timeframe: "recent" });
    }
  }, [filters, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID, Customer, or Phone..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 rounded-full border-cocoa/20 bg-white focus-visible:ring-primary h-10"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={filters.date || ""}
            onChange={(e) => onChange({ ...filters, date: e.target.value })}
            className="w-[140px] rounded-full border-cocoa/20 bg-white h-10"
          />

          <Select value={filters.source || "all"} onValueChange={(val) => onChange({ ...filters, source: val })}>
            <SelectTrigger className="w-[120px] rounded-full bg-white border-cocoa/20 h-10">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px] rounded-full bg-white border-cocoa/20 h-10">
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
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex p-1 bg-white border border-cocoa/20 rounded-full w-fit">
        <button
          onClick={() => onChange({ ...filters, timeframe: "recent" })}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filters.timeframe === "recent" || (!filters.timeframe && !filters.date)
              ? "bg-cocoa text-white"
              : "text-muted-foreground hover:text-cocoa"
          }`}
        >
          Recent (24h)
        </button>
        <button
          onClick={() => onChange({ ...filters, timeframe: "in_process" })}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filters.timeframe === "in_process"
              ? "bg-amber-600 text-white"
              : "text-muted-foreground hover:text-cocoa"
          }`}
        >
          In Process
        </button>
        <button
          onClick={() => onChange({ ...filters, timeframe: "all" })}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filters.timeframe === "all"
              ? "bg-cocoa text-white"
              : "text-muted-foreground hover:text-cocoa"
          }`}
        >
          All Time
        </button>
      </div>
    </div>
  );
}
