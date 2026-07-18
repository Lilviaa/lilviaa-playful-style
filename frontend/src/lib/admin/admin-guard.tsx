import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAdminAuth } from "@/lib/admin/admin-auth";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdminUser, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (!isAdminUser) {
      toast.error("Not authorized to access Admin panel");
      navigate({ to: "/", replace: true });
    }
  }, [user, isAdminUser, isLoading, navigate]);

  if (isLoading || (!isAdminUser && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdminUser) {
    return null;
  }

  return <>{children}</>;
}
