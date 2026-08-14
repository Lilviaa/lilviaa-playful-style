import {
  type Review,
  useUpdateReviewStatus,
  useToggleFeature,
  useEditReviewText,
  useDeleteReview,
} from "@/lib/admin/reviews-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  ShieldCheck,
  Pin,
  Check,
  X,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

interface ReviewDetailModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-5 w-5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-cocoa/20"}`}
        />
      ))}
    </div>
  );
}

export function ReviewDetailModal({ review, isOpen, onClose }: ReviewDetailModalProps) {
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateReviewStatus();
  const { mutate: toggleFeature, isPending: togglingFeature } = useToggleFeature();
  const { mutate: editText, isPending: editingText } = useEditReviewText();
  const { mutate: deleteReview, isPending: deletingReview } = useDeleteReview();

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(review.text);

  const handleSaveEdit = () => {
    if (editedText.trim() === review.text.trim()) {
      setIsEditing(false);
      return;
    }
    editText({ id: review.id, text: editedText.trim() });
    setIsEditing(false);
  };

  const handleApprove = () => {
    updateStatus({ id: review.id, status: "approved" });
    onClose();
  };

  const handleReject = () => {
    updateStatus({ id: review.id, status: "rejected" });
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this review?")) {
      deleteReview(review.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-cocoa">Review Detail</DialogTitle>
          <DialogDescription>
            Review ID: <code className="font-mono text-xs">{review.id}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Product + Customer */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-sand/30 border border-cocoa/10">
            <img
              src={review.product_image}
              alt={review.product_name}
              className="h-14 w-14 rounded-xl object-cover border border-cocoa/10 shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/56"; }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-cocoa">{review.product_name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                by <span className="font-medium text-cocoa">{review.customer_name}</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {review.order_item_id ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Purchase
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Unverified
                  </Badge>
                )}
                {review.is_featured && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] gap-1">
                    <Pin className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <StarRating rating={review.rating} />
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>



          {/* Review Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-cocoa uppercase tracking-wider">Review Text</p>
              {!isEditing && review.status !== "rejected" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 text-xs text-muted-foreground"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                  Fix Typos
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Only fix spelling/grammar. Do not change the meaning or sentiment of the review.
                </div>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={5}
                  className="rounded-xl border-cocoa/20 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-full" onClick={handleSaveEdit} disabled={editingText}>
                    Save Fix
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedText(review.text); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-cocoa/80 leading-relaxed bg-sand/20 rounded-xl p-4 border border-cocoa/5">
                "{review.text}"
              </p>
            )}
          </div>

          {/* Feature Toggle */}
          {review.status === "approved" && (
            <button
              onClick={() => toggleFeature({ id: review.id, featured: !review.is_featured })}
              disabled={togglingFeature}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                review.is_featured
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-sand/20 border-cocoa/10 text-cocoa hover:bg-sand/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4" />
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    {review.is_featured ? "Featured on Homepage" : "Feature on Homepage"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Featured reviews appear at the top of the product page and run on the homepage.
                  </p>
                </div>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                review.is_featured ? "bg-amber-500 border-amber-500" : "border-cocoa/30"
              }`}>
                {review.is_featured && <Check className="h-3 w-3 text-white" />}
              </div>
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-cocoa/10">
            {review.status !== "approved" && (
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-full"
                onClick={handleApprove}
                disabled={updatingStatus}
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
            )}
            {review.status !== "rejected" && (
              <Button
                variant="outline"
                className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 rounded-full"
                onClick={handleReject}
                disabled={updatingStatus}
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            )}
            <Button variant="ghost" className="rounded-full" onClick={onClose}>
              Close
            </Button>
            <div className="flex-1"></div>
            <Button
              variant="ghost"
              className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
              onClick={handleDelete}
              disabled={deletingReview}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
