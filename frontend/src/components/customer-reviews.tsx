import { useState } from "react";
import { Star, StarHalf, CheckCircle2, ChevronDown, Edit2 } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title?: string;
  text: string;
  reviewerName: string;
  date: string;
  verifiedPurchase: boolean;
}

// Initial mock data
const initialReviews: Review[] = [];

export function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isWriting, setIsWriting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Form State
  const [rating, setRating] = useState(0);
  const [ratingError, setRatingError] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
    
  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setRatingError("Please select a star rating");
      return;
    }
    const newReview: Review = {
      id: Date.now().toString(),
      rating,
      title,
      text,
      reviewerName: name,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      verifiedPurchase: verified,
    };
    
    setReviews([newReview, ...reviews]);
    setIsWriting(false);
    
    // Reset form
    setRating(0);
    setTitle("");
    setText("");
    setName("");
    setEmail("");
    setVerified(false);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 border-t border-border mt-8">
      <div className="mb-12">
        <h2 className="font-display text-2xl text-cocoa md:text-3xl uppercase tracking-widest mb-2">Customer Reviews</h2>
        <p className="text-muted-foreground">Real feedback from our Lil Viaaa community.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Left Column: Summary */}
        <div className="lg:col-span-4 lg:pr-8 lg:border-r lg:border-border/60">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="font-display text-6xl text-cocoa">{averageRating}</h3>
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-5 w-5 ${star <= Number(averageRating) ? "fill-[#d4af37] text-[#d4af37]" : "text-muted-foreground/30 fill-transparent"}`} 
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{reviews.length} Reviews</p>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {distribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-12 font-bold text-cocoa flex items-center gap-1">{star} <Star className="h-3 w-3 fill-cocoa text-cocoa" /></span>
                <div className="flex-1 h-2 bg-border/50 rounded-full overflow-hidden">
                  <div className="h-full bg-cocoa rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsWriting(!isWriting)}
            className="w-full flex items-center justify-center gap-2 bg-cocoa text-white font-bold uppercase tracking-widest text-sm py-4 hover:bg-cocoa/90 transition-colors shadow-sm"
          >
            <Edit2 className="h-4 w-4" />
            Write a Review
          </button>
        </div>

        {/* Right Column: List & Form */}
        <div className="lg:col-span-8">
          
          {isWriting && (
            <div className="bg-sand p-6 md:p-8 rounded-2xl mb-10 border border-border shadow-sm animate-in fade-in slide-in-from-top-4">
              <h3 className="font-display text-xl text-cocoa mb-6">Write a Review</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-bold text-cocoa uppercase tracking-widest mb-2">Overall Rating *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => { setRating(star); setRatingError(""); }}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star 
                          className={`h-8 w-8 transition-colors ${
                            star <= (hoverRating || rating) 
                              ? "fill-[#d4af37] text-[#d4af37]" 
                              : "text-muted-foreground/30 fill-transparent"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  {ratingError && <p className="text-red-500 text-xs font-bold mt-2">{ratingError}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-cocoa uppercase tracking-widest mb-2">Name *</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-border rounded-md focus:border-cocoa focus:ring-1 focus:ring-cocoa outline-none transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-cocoa uppercase tracking-widest mb-2">Email *</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-border rounded-md focus:border-cocoa focus:ring-1 focus:ring-cocoa outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-cocoa uppercase tracking-widest mb-2">Review Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full h-12 px-4 bg-white border border-border rounded-md focus:border-cocoa focus:ring-1 focus:ring-cocoa outline-none transition-all"
                    placeholder="Give your review a short title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-cocoa uppercase tracking-widest mb-2">Review *</label>
                  <textarea 
                    required
                    rows={4}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full p-4 bg-white border border-border rounded-md focus:border-cocoa focus:ring-1 focus:ring-cocoa outline-none transition-all resize-y"
                    placeholder="What did you like or dislike? How was the fit and material?"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="verified"
                    checked={verified}
                    onChange={e => setVerified(e.target.checked)}
                    className="h-5 w-5 rounded border-border text-cocoa focus:ring-cocoa bg-white"
                  />
                  <label htmlFor="verified" className="text-sm font-semibold text-cocoa cursor-pointer">
                    I have purchased this product from Lil Viaaa
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-cocoa text-white font-bold uppercase tracking-widest text-sm h-12 hover:bg-cocoa/90 transition-colors shadow-sm"
                  >
                    Submit Review
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsWriting(false)}
                    className="flex-1 bg-transparent border border-cocoa text-cocoa font-bold uppercase tracking-widest text-sm h-12 hover:bg-cocoa hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-16 px-4 bg-sand/50 rounded-2xl border border-border border-dashed">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h4 className="font-display text-xl text-cocoa mb-2">No reviews yet</h4>
              <p className="text-muted-foreground">Be the first to review this product and help others make a choice!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {reviews.map((review) => (
                <div key={review.id} className="pb-8 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= review.rating ? "fill-[#d4af37] text-[#d4af37]" : "text-muted-foreground/30 fill-transparent"}`} 
                          />
                        ))}
                      </div>
                      {review.title && <h4 className="font-bold text-cocoa">{review.title}</h4>}
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0">{review.date}</span>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">{review.text}</p>
                  
                  <div className="flex items-center gap-3 text-sm mt-4">
                    <div className="h-8 w-8 rounded-full bg-sand border border-border text-cocoa flex items-center justify-center font-bold uppercase shrink-0 shadow-sm">
                      {review.reviewerName.charAt(0)}
                    </div>
                    <span className="font-bold text-cocoa">{review.reviewerName}</span>
                    {review.verifiedPurchase && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {reviews.length > 3 && (
                <div className="pt-4 text-center">
                  <button className="inline-flex items-center gap-2 text-sm font-bold text-cocoa hover:text-primary transition-colors uppercase tracking-widest">
                    Load More <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
