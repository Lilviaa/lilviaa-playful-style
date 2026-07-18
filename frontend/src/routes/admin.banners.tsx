import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/banners')({
  component: BannersPage,
});

function BannersPage() {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-cocoa capitalize">banners</h1>
      </div>
      <div className="rounded-2xl border border-cocoa/10 bg-white p-8 shadow-sm flex items-center justify-center text-muted-foreground">
        This module is currently under construction.
      </div>
    </div>
  );
}