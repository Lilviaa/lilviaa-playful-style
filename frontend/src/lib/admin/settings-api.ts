import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ==========================================
// TYPES
// ==========================================
export interface StoreDetails {
  store_name: string;
  contact_email: string;
  support_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  base_currency: string;
}

export interface ShippingZone {
  id: string;
  name: string; // e.g., "India", "International"
  standard_rate: number;
  express_rate: number;
  free_shipping_threshold: number | null;
}

export interface TaxSettings {
  prices_include_tax: boolean;
  base_tax_percentage: number;
}

export interface PaymentGateway {
  id: "razorpay" | "stripe" | "cod";
  name: string;
  is_enabled: boolean;
}

export interface NotificationSettings {
  email_on_new_order: boolean;
  email_on_return_request: boolean;
  email_on_low_stock: boolean;
}

export interface StoreSettings {
  details: StoreDetails;
  shipping: ShippingZone[];
  taxes: TaxSettings;
  payments: PaymentGateway[];
  notifications: NotificationSettings;
}

// ==========================================
// MOCK DATABASE STATE
// ==========================================
export let MOCK_SETTINGS: StoreSettings = {
  details: {
    store_name: "Lilviaa",
    contact_email: "support@lilviaa.com",
    support_phone: "+91 9876543210",
    address_line1: "123 Apparel Street",
    address_line2: "Block B, Textile Park",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    base_currency: "INR",
  },
  shipping: [
    {
      id: "SZ-1",
      name: "Domestic (India)",
      standard_rate: 50,
      express_rate: 150,
      free_shipping_threshold: 1500,
    },
    {
      id: "SZ-2",
      name: "International",
      standard_rate: 1200,
      express_rate: 2500,
      free_shipping_threshold: null,
    }
  ],
  taxes: {
    prices_include_tax: true,
    base_tax_percentage: 12,
  },
  payments: [
    { id: "razorpay", name: "Razorpay (UPI, Cards, NetBanking)", is_enabled: true },
    { id: "stripe", name: "Stripe (International Cards)", is_enabled: false },
    { id: "cod", name: "Cash on Delivery (COD)", is_enabled: true },
  ],
  notifications: {
    email_on_new_order: true,
    email_on_return_request: true,
    email_on_low_stock: false,
  }
};

// ==========================================
// HELPERS
// ==========================================
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ==========================================
// REACT QUERY HOOKS
// ==========================================

export function useSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      await delay(300);
      return JSON.parse(JSON.stringify(MOCK_SETTINGS)) as StoreSettings;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedSettings: StoreSettings) => {
      await delay(500);
      MOCK_SETTINGS = JSON.parse(JSON.stringify(updatedSettings));
      return MOCK_SETTINGS;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Settings saved successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save settings");
    }
  });
}
