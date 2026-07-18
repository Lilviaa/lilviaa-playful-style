import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminGuard } from "@/lib/admin/admin-guard";
import { AdminLayout } from "@/components/admin/admin-layout";

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});

function AdminRoute() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminGuard>
  );
}
