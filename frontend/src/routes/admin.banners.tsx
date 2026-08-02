import { createFileRoute } from '@tanstack/react-router';
import { HeroBannerEditor } from '@/components/admin/cms/hero-banner-editor';
import { PromoStripEditor } from '@/components/admin/cms/promo-strip-editor';
import { CategoryTilesEditor } from '@/components/admin/cms/category-tiles-editor';
import { FeaturedCarouselEditor } from '@/components/admin/cms/featured-carousel-editor';
import { OurStoryEditor } from '@/components/admin/cms/our-story-editor';
import { OurPhilosophyEditor } from '@/components/admin/cms/our-philosophy-editor';
import { AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/admin/banners')({
  component: BannersPage,
});

function BannersPage() {
  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="font-display text-3xl font-bold text-cocoa capitalize">Content Management</h1>
        <p className="text-muted-foreground mt-1">Manage homepage banners, featured products, and your brand story.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Important Note:</strong> The Storefront routes <code>routes/index.tsx</code> (homepage hero, category grid, featured carousel) and <code>routes/about.tsx</code> (Our Story) currently render <strong>hardcoded content</strong>. 
          <br className="mb-2" />
          They must be updated to fetch from these new CMS tables. This module will have no visible effect on the storefront until that follow-up integration is done.
        </div>
      </div>

      <div className="space-y-8">
        <PromoStripEditor />
        <HeroBannerEditor />
        <CategoryTilesEditor />
        <FeaturedCarouselEditor />
        <OurStoryEditor />
        <OurPhilosophyEditor />
      </div>
    </div>
  );
}