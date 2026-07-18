import {
  Review,
  ReviewStatus,
  useReviews,
  useUpdateReviewStatus,
  useToggleFeature,
} from "@/lib/admin/reviews-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ShieldCheck, Pin, Check, X, Eye } from "lucide-react";
import { useState } from "react";
import { ReviewDetailModal } from "./review-detail-modal";

const STATUS_MAP: Record<ReviewStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
};

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-cocoa/20"}`}
        />
      ))}
    </div>
  );
}

export function ReviewsTable() {
  const [activeTab, setActiveTab] = useState<ReviewStatus | "all">("pending");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const { data: reviews = [], isLoading } = useReviews(activeTab);
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateReviewStatus();
  const { mutate: toggleFeature } = useToggleFeature();

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-sand/50 rounded-xl">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="rounded-lg">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="rounded-2xl border border-cocoa/10 bg-white p-12 text-center text-muted-foreground">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cocoa/20 bg-sand/10 p-12 text-center text-muted-foreground">
          No reviews in this category.
        </div>
      ) : (
        <div className="rounded-2xl border border-cocoa/10 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand/50 border-b border-cocoa/10">
              <tr>
                {["Product", "Customer", "Rating", "Review", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left text-cocoa font-bold px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr
                  key={review.id}
                  className={`border-b border-cocoa/5 hover:bg-sand/20 transition-colors ${
                    review.is_featured ? "bg-amber-50/30" : ""
                  }`}
                >
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={review.product_image}
                        alt={review.product_name}
                        className="h-10 w-10 rounded-lg object-cover border border-cocoa/10 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40"; }}
                      />
                      <p className="text-xs font-medium text-cocoa max-w-[120px] truncate">
                        {review.product_name}
                      </p>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="font-medium text-cocoa text-xs">{review.customer_name}</p>
                      {review.order_item_id ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Unverified</p>
                      )}
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    <StarRating rating={review.rating} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{review.rating}/5</p>
                  </td>

                  {/* Review text */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {review.text}
                    </p>
                    {review.is_featured && (
                      <div className="flex items-center gap-1 mt-1 text-amber-600 text-[10px] font-medium">
                        <Pin className="h-3 w-3" />
                        Featured
                      </div>
                    )}
                  </td>



                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${STATUS_MAP[review.status].className}`}>
                      {STATUS_MAP[review.status].label}
                    </Badge>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-cocoa"
                        title="View full review"
                        onClick={() => setSelectedReview(review)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {review.status !== "approved" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                          title="Approve"
                          disabled={updatingStatus}
                          onClick={() => updateStatus({ id: review.id, status: "approved" })}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {review.status !== "rejected" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:bg-red-50"
                          title="Reject"
                          disabled={updatingStatus}
                          onClick={() => updateStatus({ id: review.id, status: "rejected" })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {review.status === "approved" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-7 w-7 ${review.is_featured ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}
                          title={review.is_featured ? "Unpin from featured" : "Pin to top"}
                          onClick={() => toggleFeature({ id: review.id, featured: !review.is_featured })}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  );
}
