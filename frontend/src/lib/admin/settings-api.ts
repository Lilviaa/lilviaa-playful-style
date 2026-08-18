import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";

export interface CompanySettings {
  id: string;
  company_name: string;
  business_email: string;
  website?: string;
  phone_primary: string;
  phone_secondary?: string;
  gst_number?: string;
  address_line?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  logo_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  whatsapp_number?: string;
  support_email?: string;
  created_at?: string;
  updated_at?: string;
  
  // Billing & Shipping Settings
  enable_gst?: boolean;
  gst_percentage?: number;
  home_state?: string;
  shipping_charge_home?: number;
  shipping_charge_other?: number;
  enable_free_shipping?: boolean;
  free_shipping_above?: number;
  
  // Website Status
  is_maintenance_mode?: boolean;
}

// Public hook to fetch settings
export function useCompanySettings() {
  return useQuery({
    queryKey: ["companySettings"],
    queryFn: async () => {
      const res = await apiFetch("/cms/company-settings");
      if (!res.ok) throw new Error("Failed to fetch company settings");
      return res.json() as Promise<CompanySettings>;
    },
  });
}

// Admin hook to update settings
export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<CompanySettings>) => {
      const res = await apiFetch("/admin/cms/company-settings", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update company settings");
      return res.json() as Promise<CompanySettings>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
    },
  });
}
