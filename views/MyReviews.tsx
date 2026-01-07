
import React from 'react';
import { useNavigate } from 'react-router-dom';

const MyReviews: React.FC = () => {
  const navigate = useNavigate();

  const reviews = [
    {
      id: 'rev-1',
      productName: "Traditional Silk Dirac",
      productImg: "https://picsum.photos/id/1011/200/200",
      rating: 5,
      date: "Oct 20, 2023",
      text: "The quality exceeded my expectations. Beautiful fabric and fast delivery!",
      status: "VERIFIED"
    },
    {
      id: 'rev-2',
      productName: "Oud Essence 50ml",
      productImg: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?q=80&w=400",
      rating: 4,
      date: "Sept 28, 2023",
      text: "Authentic scent, though the bottle size was slightly smaller than imagined.",
      status: "VERIFIED"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none">My Reviews</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{reviews.length} Published Feedbacks</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-10 no-scrollbar animate-in fade-in duration-500">
        <section className="flex flex-col gap-4">
           {reviews.map(rev => (
             <div key={rev.id} className="bg-white dark:bg-surface-dark p-5 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <img src={rev.productImg} className="size-12 rounded-xl object-cover" alt="Product" />
                      <div>
                         <h4 className="text-xs font-black text-secondary dark:text-white uppercase truncate w-32">{rev.productName}</h4>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{rev.date}</p>
                      </div>
                   </div>
                   <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[16px] ${i < rev.rating ? 'fill-1' : ''}`}>star</span>
                      ))}
                   </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                   <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">"{rev.text}"</p>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">{rev.status} PURCHASE</span>
                   <div className="flex gap-2">
                      <button className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Edit</button>
                      <button className="text-[9px] font-black text-red-500 uppercase tracking-widest">Delete</button>
                   </div>
                </div>
             </div>
           ))}
        </section>
      </main>
    </div>
  );
};

export default MyReviews;
