import { Search, Menu, LogOut, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { AdminSidebar } from "./admin-sidebar";
import { useState, useEffect } from "react";

function LiveClock() {
  const [date, setDate] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm font-medium text-cocoa/70 hidden sm:inline-block">
      {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      {' • '}
      {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
}

export function AdminTopbar() {
  const { user, logout, isLoggingOut } = useAuth();
  const [open, setOpen] = useState(false);

  // Fallbacks for display name and role
  const displayName = (user as any)?.name || user?.full_name || (user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || "Admin";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const displayRole = user?.role || "Owner";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="md:hidden p-2 -ml-2 text-cocoa hover:bg-sand rounded-full">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <div onClick={() => setOpen(false)} className="h-full">
            <AdminSidebar className="border-r-0 h-full w-full" />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 px-2">
        <LiveClock />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-sm font-bold text-cocoa">{displayName}</span>
          <span className="text-xs text-cocoa/60 capitalize">{displayRole}</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary text-white font-bold text-xs uppercase">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <div className="px-2 py-1.5 text-sm font-medium text-cocoa truncate">
              {displayName}
              <div className="text-xs font-normal text-muted-foreground truncate">{user?.email}</div>
            </div>
            <div className="h-px bg-border my-1" />
            <DropdownMenuItem 
              onClick={(e) => {
                if (isLoggingOut) {
                  e.preventDefault();
                  return;
                }
                logout();
              }}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

