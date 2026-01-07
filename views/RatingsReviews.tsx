
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  text: string;
  helpfulCount: number;
  isVerified: boolean;
  images?: string[];
  vendorReply?: string;
}

const RatingsReviews: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeFilter, setActiveFilter] = useState('All');
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  const reviews: Review[] = [
    {
      id: 'R1',
      user: 'Amina K.',
      rating: 5,
      date: '2 days ago',
      isVerified: true,
      text: 'Absolutely stunning quality. The color is even more vibrant in person. Fits perfectly! I wore it for a wedding and received so many compliments.',
      helpfulCount: 24,
      images: ['https://picsum.photos/id/1011/200/200'],
      vendorReply: 'Thank you Amina! We are so happy you loved the Dirac. Looking forward to your next visit!'
    },
    {
      id: 'R2',
      user: 'Mustafa O.',
      rating: 4,
      date: '1 week ago',
      isVerified: true,
      text: 'Fast delivery to Jigjiga Yar. Packaged beautifully. Material is very high quality, though the sizing was a bit larger than expected.',
      helpfulCount: 12
    },
    {
      id: 'R3',
      user: 'Sahra M.',
      rating: 5,
      date: 'Oct 12, 2023',
      isVerified: true,
      text: 'The best Dirac I have ever bought online. Fudaydiye express delivery actually arrived in 45 minutes. Incredible service.',
      helpfulCount: 8,
      images: ['https://picsum.photos/id/1012/200/200', 'https://picsum.photos/id/1013/200/200']
    }
  ];

  const toggleHelpful = (id: string) => {
    const newSet = new Set(helpfulReviews);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setHelpfulReviews(newSet);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-90 text-text-main dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black tracking-tight text-secondary dark:text-white uppercase tracking-widest">Ratings & Reviews</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase">Premium Silk Dirac</p>
        </div>
        <button className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-secondary dark:text-primary">
          <span className="material-symbols-outlined">search</span>
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        {/* Rating Summary Card */}
        <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] shadow-card border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-6xl font-black text-secondary dark:text-white leading-none tracking-tighter">4.8</div>
              <div className="flex text-amber-400 mt-3 justify-center">
                {[1, 2, 3, 4, 5].map(i => <span key={i} className="material-symbols-outlined text-[20px] fill-1">star</span>)}
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">2,412 Reviews</p>
            </div>
            <div className="flex-1 space-y-2">
              <RatingBar label="5" percentage={85} />
              <RatingBar label="4" percentage={10} />
              <RatingBar label="3" percentage={3} />
              <RatingBar label="2" percentage={1} />
              <RatingBar label="1" percentage={1} />
            </div>
          </div>

          <button className="w-full h-14 bg-primary text-secondary font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-primary-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">rate_review</span>
            Write a Review
          </button>
        </section>

        {/* Filters */}
        <section className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
          {['All', 'With Photos', '5 Star', '4 Star', '3 Star'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${
                activeFilter === f
                  ? 'bg-secondary text-primary border-secondary shadow-md'
                  : 'bg-white dark:bg-surface-dark text-gray-400 border-gray-100 dark:border-gray-800'
              }`}
            >
              {f}
            </button>
          ))}
        </section>

        {/* Reviews List */}
        <section className="flex flex-col gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-primary font-black border border-gray-200 dark:border-white/10 shadow-inner">
                    {review.user.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-secondary dark:text-white leading-none">{review.user}</h4>
                      {review.isVerified && (
                        <span className="bg-primary/10 text-primary text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Verified</span>
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{review.date}</p>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-[14px] ${i < review.rating ? 'fill-1' : ''}`}>star</span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {review.text}
              </p>

              {review.images && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((img, i) => (
                    <div key={i} className="size-20 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm transition-transform active:scale-95">
                      <img src={img} className="w-full h-full object-cover" alt="Review" />
                    </div>
                  ))}
                </div>
              )}

              {review.vendorReply && (
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border-l-4 border-primary mb-4">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Store Response</p>
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed">"{review.vendorReply}"</p>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-gray-50 dark:border-white/5">
                <button 
                  onClick={() => toggleHelpful(review.id)}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    helpfulReviews.has(review.id) ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${helpfulReviews.has(review.id) ? 'icon-filled' : ''}`}>thumb_up</span>
                  Helpful ({review.helpfulCount + (helpfulReviews.has(review.id) ? 1 : 0)})
                </button>
                <button className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-auto">
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                  Report
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Floating AI Summary Suggestion */}
        <div className="bg-secondary text-white p-5 rounded-[28px] shadow-2xl relative overflow-hidden group border border-primary/20">
           <div className="absolute top-0 right-0 size-24 bg-primary/20 blur-3xl rounded-full"></div>
           <div className="relative z-10 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 animate-pulse">
                 <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div className="flex-1">
                 <h4 className="text-xs font-black uppercase tracking-widest">AI Review Summary</h4>
                 <p className="text-[9px] font-medium opacity-60">"Most buyers love the fabric quality but suggest ordering a size down."</p>
              </div>
              <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
           </div>
        </div>
      </main>
    </div>
  );
};

const RatingBar: React.FC<{ label: string; percentage: number }> = ({ label, percentage }) => (
  <div className="flex items-center gap-3">
    <span className="text-[10px] font-black text-gray-400 w-2">{label}</span>
    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
      <div 
        className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
    <span className="text-[9px] font-bold text-gray-400 w-8">{percentage}%</span>
  </div>
);

export default RatingsReviews;
