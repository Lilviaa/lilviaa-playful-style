import type { User } from "@/lib/auth";

export type AdminRole = "owner" | "admin";

export interface AdminUser {
  user: User;
  role: AdminRole;
}
