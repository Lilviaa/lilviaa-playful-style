import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CustomerTable } from "@/components/admin/customers/customer-table";
import { useCustomers } from "@/lib/admin/customers-api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const searchSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["spend", "recent"]).optional(),
});

export const Route = createFileRoute("/admin/customers/")({
  component: CustomersPage,
  validateSearch: searchSchema,
});

function CustomersPage() {
  const { search, sort } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [localSearch, setLocalSearch] = useState(search || "");
  const [localSort, setLocalSort] = useState<"spend" | "recent">(sort || "recent");

  const { data: customers = [], isLoading } = useCustomers(localSearch, localSort);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    navigate({
      search: (old) => ({ ...old, search: val || undefined }),
      replace: true,
    });
  };

  const handleSortChange = (val: "spend" | "recent") => {
    setLocalSort(val);
    navigate({
      search: (old) => ({ ...old, sort: val === "recent" ? undefined : val }),
      replace: true,
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa capitalize">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer list, view their lifetime value, and assign VIP tags.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 rounded-full border-cocoa/20 bg-white focus-visible:ring-primary h-10 w-full"
            />
          </div>
          <Select value={localSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[160px] rounded-full bg-white border-cocoa/20 shrink-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="spend">Highest Spend (LTV)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CustomerTable data={customers} isLoading={isLoading} />
    </div>
  );
}
