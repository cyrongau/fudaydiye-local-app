
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  text: string;
  responded: boolean;
  reply?: string;
  img?: string;
}

const VendorReviews: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'UNREPLIED'>('ALL');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'REV-101',
      user: 'Amina K.',
      rating: 5,
      date: '2h ago',
      text: 'The Silk Chiffon Dirac is absolutely beautiful. The quality is even better than what I saw in the live stream!',
      responded: true,
      reply: 'Thank you Amina! We take pride in our fabric quality. Enjoy your purchase!',
      img: 'https://i.pravatar.cc/100?u=12'
    },
    {
      id: 'REV-102',
      user: 'Mustafa Ali',
      rating: 4,
      date: 'Yesterday',
      text: 'Fast delivery to Jigjiga Yar. The package was sealed well. One minor loose thread, but otherwise perfect.',
      responded: false,
      img: 'https://i.pravatar.cc/100?u=15'
    },
    {
      id: 'REV-103',
      user: 'Sahra Mahamed',
      rating: 5,
      date: '3 days ago',
      text: 'Best electronics store in Hargeisa. Fudaydiye express delivery is a game changer.',
      responded: false,
      img: 'https://i.pravatar.cc/100?u=22'
    }
  ]);

  const stats = {
    average: 4.9,
    total: 124,
    responseRate: '92%',
    fulfillmentScore: 98,
  };

  const handleReply = (id: string) => {
    setReviews(prev => prev.map(rev => 
      rev.id === id ? { ...rev, responded: true, reply: replyText } : rev
    ));
    setReplyingTo(null);
    setReplyText('');
  };

  const filteredReviews = filter === 'ALL' ? reviews : reviews.filter(r => !r.responded);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none">Reputation</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Trust & Feedback</p>
          </div>
        </div>
        <button className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined">verified</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        {/* Rating Hero Card */}
        <section className="bg-secondary text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
             <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-6">
                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Top Rated Seller</span>
             </div>
             <h2 className="text-7xl font-black tracking-tighter leading-none mb-2">{stats.average}</h2>
             <div className="flex text-primary mb-4">
                {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-[28px] fill-1">star</span>)}
             </div>
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Based on {stats.total} verified reviews</p>
          </div>
        </section>

        {/* Reputation Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft">
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Response Rate</p>
             <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-secondary dark:text-white leading-none">{stats.responseRate}</span>
                <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                   <span className="material-symbols-outlined text-sm">chat</span>
                </div>
             </div>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft">
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Fulfillment</p>
             <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-secondary dark:text-white leading-none">{stats.fulfillmentScore}%</span>
                <div className="size-8 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-500">
                   <span className="material-symbols-outlined text-sm">local_shipping</span>
                </div>
             </div>
          </div>
        </div>

        {/* AI Sentiment Analysis */}
        <section className="bg-primary/5 rounded-[32px] p-6 border border-primary/20 flex items-center gap-5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-primary text-5xl">auto_awesome</span>
           </div>
           <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-secondary shadow-lg shrink-0">
              <span className="material-symbols-outlined text-3xl font-black">psychology</span>
           </div>
           <div>
              <h4 className="text-sm font-black text-secondary dark:text-white leading-tight mb-1">AI Sentiment Insight</h4>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest">
                Customers frequently praise your <span className="text-primary font-bold">"fast delivery"</span> and <span className="text-primary font-bold">"packaging quality"</span>. Minor mentions of sizing clarity could be improved in descriptions.
              </p>
           </div>
        </section>

        {/* Reviews Feed */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer Feed</h3>
            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
               <button 
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}
               >All</button>
               <button 
                onClick={() => setFilter('UNREPLIED')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'UNREPLIED' ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'}`}
               >Unreplied</button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
             {filteredReviews.map(review => (
               <div key={review.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-3">
                        <img src={review.img} className="size-11 rounded-2xl object-cover shadow-sm border border-gray-100 dark:border-white/10" alt={review.user} />
                        <div>
                           <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1">{review.user}</h4>
                           <div className="flex items-center gap-2">
                              <div className="flex text-amber-400">
                                 {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`material-symbols-outlined text-[14px] ${i < review.rating ? 'fill-1' : ''}`}>star</span>
                                 ))}
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{review.date}</span>
                           </div>
                        </div>
                     </div>
                     <button className="size-9 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                     </button>
                  </div>

                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">
                     "{review.text}"
                  </p>

                  {review.responded ? (
                    <div className="bg-primary/5 p-4 rounded-2xl border-l-4 border-primary mt-2">
                       <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Your Reply</p>
                       <p className="text-xs font-medium text-secondary dark:text-gray-400 leading-relaxed">"{review.reply}"</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                       {replyingTo === review.id ? (
                         <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                            <textarea 
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a professional response..."
                              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium focus:ring-primary/20 focus:border-primary transition-all resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                               <button 
                                onClick={() => setReplyingTo(null)}
                                className="flex-1 h-11 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500"
                               >Cancel</button>
                               <button 
                                onClick={() => handleReply(review.id)}
                                disabled={!replyText.trim()}
                                className="flex-[2] h-11 bg-primary text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
                               >Post Reply</button>
                            </div>
                         </div>
                       ) : (
                         <button 
                          onClick={() => setReplyingTo(review.id)}
                          className="h-11 px-6 bg-secondary text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                         >
                            <span className="material-symbols-outlined text-[18px]">reply</span>
                            Reply to {review.user.split(' ')[0]}
                         </button>
                       )}
                    </div>
                  )}
               </div>
             ))}
          </div>
        </section>
      </main>

      <BottomNav items={[
        { label: 'Home', icon: 'grid_view', path: '/vendor' },
        { label: 'Orders', icon: 'receipt_long', path: '/vendor/orders' },
        { label: 'Scan', icon: 'qr_code_scanner', path: '/vendor/scan', special: true },
        { label: 'Reputation', icon: 'star', path: '/vendor/reviews' },
        { label: 'Inventory', icon: 'inventory_2', path: '/vendor/inventory' },
      ]} />
    </div>
  );
};

export default VendorReviews;
