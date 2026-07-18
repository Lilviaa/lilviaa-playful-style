import type { User } from "@/lib/auth";

export type AdminRole = "owner";

export interface AdminUser {
  user: User;
  role: AdminRole;
}
