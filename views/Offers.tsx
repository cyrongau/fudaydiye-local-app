
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Offers: React.FC = () => {
  const navigate = useNavigate();

  const coupons = [
    { id: '1', title: 'Welcome Special', discount: '20% OFF', code: 'FUDAYDIYE20', expiry: 'Expires in 2 days', type: 'Platform' },
    { id: '2', title: 'Tech Tuesday', discount: '$50 OFF', code: 'TECH50', expiry: 'Valid for Electronics', type: 'Category' },
    { id: '3', title: 'Dirac Week', discount: '10% OFF', code: 'HODAN10', expiry: 'Hodan Styles Exclusive', type: 'Vendor' },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Code ${code} copied to clipboard!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none uppercase">Offers</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Exclusive Rewards</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-10 no-scrollbar animate-in fade-in duration-500">
        <section className="bg-secondary text-white p-7 rounded-[40px] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <div className="relative z-10">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Active Wallet</h3>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black tracking-tighter">$14.20</span>
                 <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Bonus Credits</span>
              </div>
           </div>
        </section>

        <div className="flex flex-col gap-4">
           {coupons.map(coupon => (
             <div key={coupon.id} className="relative bg-white dark:bg-surface-dark rounded-[32px] p-6 border border-gray-100 dark:border-white/5 shadow-soft flex justify-between items-center overflow-hidden">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-background-light dark:bg-background-dark border-r border-gray-100 dark:border-white/5"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-background-light dark:bg-background-dark border-l border-gray-100 dark:border-white/5"></div>
                
                <div className="flex-1 pr-6 border-r-2 border-dashed border-gray-100 dark:border-white/10">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black text-primary uppercase tracking-widest">{coupon.type} Offer</span>
                   </div>
                   <h4 className="text-xl font-black text-secondary dark:text-white leading-none mb-1">{coupon.discount}</h4>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">{coupon.title}</p>
                   <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{coupon.expiry}</p>
                </div>

                <div className="pl-6 flex flex-col items-center gap-2">
                   <div className="bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10">
                      <span className="text-xs font-black font-mono text-secondary dark:text-white">{coupon.code}</span>
                   </div>
                   <button 
                    onClick={() => handleCopy(coupon.code)}
                    className="text-[9px] font-black text-primary uppercase tracking-widest active:scale-95 transition-all"
                   >
                     Copy Code
                   </button>
                </div>
             </div>
           ))}
        </div>
      </main>
    </div>
  );
};

export default Offers;
