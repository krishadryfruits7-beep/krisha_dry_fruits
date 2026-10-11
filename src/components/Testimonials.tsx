import { useState, useEffect } from 'react';
import { Star, Quote, CheckCircle2, PlusCircle, X, Sparkles, Send, Check } from 'lucide-react';
import { useStoredReviews, addStoredReview, syncWithServerReviews, type CustomerReview } from '@/reviews-storage';
import { api } from '@/api';
import { useUser } from '@/auth';

const CASHEW_GRADES = [
  'W180 Jumbo King',
  'W210 Premium Whole',
  'W240 Superior Grade',
  'W320 Standard Table',
  'W450 Baby Kernels',
  'Roasted & Salted Cashews',
  'Honey Glazed Gourmet',
  'Pepper Spiced Crunch',
  'Fried & Salted Goan Special',
];

export default function Testimonials() {
  const reviews = useStoredReviews();
  const { user, isSignedIn } = useUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [gradeBought, setGradeBought] = useState(CASHEW_GRADES[0]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Sync with server reviews on mount
  useEffect(() => {
    api.reviews.list()
      .then((serverData) => {
        if (Array.isArray(serverData) && serverData.length > 0) {
          syncWithServerReviews(serverData);
        }
      })
      .catch(() => {});
  }, []);

  // Pre-fill user name if logged in
  useEffect(() => {
    if (isSignedIn && user?.fullName && !name) {
      setName(user.fullName);
    }
  }, [isSignedIn, user, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      alert('Please enter your name and a brief review.');
      return;
    }

    setSubmitting(true);
    const newRev = {
      name: name.trim(),
      location: location.trim() || 'Verified Customer',
      gradeBought: gradeBought.trim() || 'W180 Jumbo King',
      rating,
      text: text.trim(),
      verified: true,
      createdAt: new Date().toISOString(),
    };

    // 1. Immediately update locally so review appears in UI without delay
    addStoredReview(newRev);

    // 2. Submit to MongoDB in background
    try {
      await api.reviews.create(newRev);
    } catch (err) {
      console.warn('Backend review submission notice:', err);
    }

    setSubmitting(false);
    setSuccessMsg(true);
    setText('');

    setTimeout(() => {
      setSuccessMsg(false);
      setModalOpen(false);
    }, 1800);
  };

  return (
    <section id="reviews-section" className="bg-gradient-to-b from-cream-100/50 via-cream-200/40 to-cream-100/80 py-14 sm:py-20 border-t border-brand-200/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Heading & "Write a Review" Action */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md px-3.5 py-1 mb-3.5 border border-brand-200/70 shadow-sm">
              <Star className="w-3 h-3 text-gold-500 fill-current" />
              <span className="text-[11px] font-bold text-brand-900 tracking-wide">
                Verified Customer Feedback
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-950 tracking-tight mb-2">
              Loved for Freshness & Craft
            </h2>
            <p className="text-xs sm:text-sm text-brand-700/80 leading-relaxed font-normal">
              Real reviews from cashew connoisseurs, home chefs, and certified buyers across India.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary py-3 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-brand-900/15 shrink-0 self-start sm:self-auto group"
          >
            <PlusCircle className="w-4 h-4 text-amber-300 transition-transform group-hover:rotate-90 duration-300" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Real Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((t, idx) => (
            <div
              key={t.id || t._id || `${t.name}-${idx}`}
              className="card card-hover p-6 sm:p-7 bg-white/95 border border-brand-200/70 flex flex-col justify-between shadow-luxury transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1" title={`${t.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <Star
                        key={starVal}
                        className={`w-3.5 h-3.5 ${
                          starVal <= t.rating ? 'text-gold-500 fill-current' : 'text-brand-200'
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-brand-300/50" />
                </div>

                <p className="text-xs sm:text-sm text-brand-900/90 leading-relaxed mb-6 font-normal">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-brand-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand-800 text-cream-50 flex items-center justify-center font-serif text-sm font-bold shadow-sm shrink-0">
                    {t.avatar || (t.name ? t.name.charAt(0).toUpperCase() : 'C')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-brand-950 flex items-center gap-1 truncate">
                      <span className="truncate">{t.name}</span>
                      <span title="Verified Customer" className="shrink-0 flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
                      </span>
                    </div>
                    <div className="text-[11px] text-brand-500 truncate">{t.location || 'India'}</div>
                  </div>
                </div>

                <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-md shrink-0">
                  {t.gradeBought}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Write Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-brand-200/80 relative animate-scale-in max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-brand-400 hover:text-brand-900 hover:bg-brand-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {successMsg ? (
              <div className="py-8 text-center space-y-3 animate-fade-in">
                <div className="w-14 h-14 bg-forest-100 text-forest-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h3 className="font-serif text-xl font-bold text-brand-950">
                  Thank You for Your Feedback!
                </h3>
                <p className="text-xs text-brand-600 max-w-xs mx-auto">
                  Your verified review has been published and is now visible to connoisseurs across India.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      Customer Experience
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-950">
                    Share Your Review
                  </h3>
                  <p className="text-xs text-brand-600 mt-0.5">
                    How was the crunch, aroma, and hand-selected quality of your cashew order?
                  </p>
                </div>

                {/* Star Rating Selector */}
                <div>
                  <label className="text-xs font-bold text-brand-900 block mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-gold-500 transition-transform hover:scale-125 focus:outline-none"
                          aria-label={`${star} star rating`}
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= (hoverRating || rating)
                                ? 'fill-current text-gold-500'
                                : 'text-brand-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-brand-800 ml-2">
                      {rating === 5 ? '5/5 — Exceptional Taste' : rating === 4 ? '4/5 — Very Good' : `${rating}/5 Stars`}
                    </span>
                  </div>
                </div>

                {/* Name & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="input-field text-xs py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-brand-900 block mb-1">
                      City, State
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Pune, Maharashtra"
                      className="input-field text-xs py-2.5"
                    />
                  </div>
                </div>

                {/* Cashew Grade Bought */}
                <div>
                  <label className="text-xs font-bold text-brand-900 block mb-1">
                    Cashew Grade / Variety Enjoyed
                  </label>
                  <select
                    value={gradeBought}
                    onChange={(e) => setGradeBought(e.target.value)}
                    className="input-field text-xs py-2.5 bg-white"
                  >
                    {CASHEW_GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Review Text */}
                <div>
                  <label className="text-xs font-bold text-brand-900 block mb-1">
                    Your Review *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Describe the crunch, aroma, freshness, packaging, and if you recommend it to family..."
                    className="input-field text-xs resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-secondary py-2.5 px-4 text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Publishing...' : 'Publish Real Review'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </section>
  );
}
