import { createFileRoute } from "@tanstack/react-router";
import { ReviewsTable } from "@/components/admin/reviews/reviews-table";
import { usePendingReviewCount } from "@/lib/admin/reviews-api";

export const Route = createFileRoute("/admin/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const { data: pendingCount = 0 } = usePendingReviewCount();

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="font-display text-3xl font-bold text-cocoa capitalize">
          Reviews Moderation
        </h1>
        <p className="text-muted-foreground mt-1">
          Approve, reject, or feature customer reviews. Pending:{" "}
          <span className="font-semibold text-amber-600">{pendingCount}</span>
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Note:</strong> Since a review feature does not currently exist in the storefront, this is a new feature schema. The storefront route <code>products.$slug.tsx</code> will need a review submission UI and review list added as a follow-up.
      </div>

      <ReviewsTable />
    </div>
  );
}