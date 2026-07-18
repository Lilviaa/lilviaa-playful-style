import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitorSmartphone, KeySquare, Wifi } from "lucide-react";

export const Route = createFileRoute("/admin/pos-connect")({
  component: POSConnectPage,
});

function POSConnectPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-cocoa">POS Connect</h1>
        <p className="text-muted-foreground mt-1">
          Manage the connection between your online store and your physical shop's billing software.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border shadow-cute">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MonitorSmartphone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-cocoa font-display">Electron POS Sync</CardTitle>
                <CardDescription>Desktop billing software connection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <Wifi className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-cocoa">Connection Status</p>
                <p className="text-xs text-muted-foreground">Ready to pair with Supabase real-time API.</p>
              </div>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-20"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your inventory and online orders will automatically sync in real-time with the Lilviaa desktop billing app once configured.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-cute opacity-75">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand text-cocoa">
                <KeySquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-cocoa font-display">API Credentials</CardTitle>
                <CardDescription>Authentication tokens for software</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Endpoint URL</label>
                <div className="rounded-md border border-border bg-sand/50 p-2 text-sm text-cocoa/50 font-mono">
                  https://api.lilviaa.com/v1/sync
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Sync Key</label>
                <div className="rounded-md border border-border bg-sand/50 p-2 text-sm text-cocoa/50 font-mono">
                  ••••••••••••••••••••••••
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
