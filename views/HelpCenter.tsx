import { Browser } from '@capacitor/browser';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemConfig } from '../hooks/useSystemConfig';

const HelpCenter: React.FC = () => {
   const navigate = useNavigate();
   const [searchQuery, setSearchQuery] = useState('');
   const { config } = useSystemConfig();

   const openExternalLink = async (url: string) => {
      await Browser.open({ url });
   };

   const getWhatsAppLink = () => {
      const phone = config?.business?.phone || '+252 63 444 1122';
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const message = encodeURIComponent("Hi Fudaydiye Support, I need help with my order.");
      return `https://wa.me/${cleanPhone}?text=${message}`;
   };

   const getTelLink = () => {
      const phone = config?.business?.phone || '+252 63 444 1122';
      // Tel links often work better with clean numbers or + prefix. 
      // Let's keep the user's formatting if they provided + but remove inner spaces for safety, or just standard clean.
      return `tel:${phone.replace(/[^0-9+]/g, '')}`;
   };

   // ... existing code ...

   const categories = [
      { label: 'Getting Started', icon: 'auto_awesome', color: 'bg-primary' },
      { label: 'Order Tracking', icon: 'near_me', color: 'bg-blue-500' },
      { label: 'Payments', icon: 'payments', color: 'bg-amber-500' },
      { label: 'Returns', icon: 'assignment_return', color: 'bg-red-500' },
   ];

   const faqs = [
      { q: 'How long does express delivery take?', a: 'Within Hargeisa, express deliveries typically arrive within 45-90 minutes depending on your location hub.' },
      { q: 'Can I pay with eDahab?', a: 'Yes! We support ZAAD, eDahab, Sahal, and global bank cards.' },
      { q: 'What is the refund policy?', a: 'Refunds are processed within 24 hours if the claim is validated by our AI dispute center.' },
   ];

   const filteredFaqs = faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()));

   return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
         <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-6 flex items-center gap-5">
            <button
               onClick={() => navigate(-1)}
               className="size-11 flex items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-soft border border-gray-100 dark:border-white/10 active:scale-90 transition-all hover:shadow-md"
               aria-label="Go Back"
            >
               <span className="material-symbols-outlined text-secondary dark:text-primary text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
               <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tighter leading-none">Help Hub</h1>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Support & Resources</p>
            </div>
         </header>

         <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-40 no-scrollbar animate-in fade-in duration-500">
            {/* Search Section */}
            <section className="space-y-4">
               <h2 className="text-3xl font-black text-secondary dark:text-white tracking-tighter leading-tight">How can we help?</h2>
               <div className="flex w-full items-center rounded-2xl bg-white dark:bg-surface-dark h-16 px-5 border border-gray-100 dark:border-gray-800 shadow-soft focus-within:border-primary/50 transition-all">
                  <span className="material-symbols-outlined text-gray-400">search</span>
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-secondary dark:text-white placeholder:text-gray-400"
                     placeholder="Search topics or keywords..."
                  />
               </div>
            </section>

            {/* Categories Grid */}
            <section className="grid grid-cols-2 gap-4">
               {categories.map(cat => (
                  <button
                     key={cat.label}
                     className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft flex flex-col items-center text-center gap-3 transition-all active:scale-95 group"
                  >
                     <div className={`size-12 rounded-2xl flex items-center justify-center ${cat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                     </div>
                     <span className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-widest leading-tight">{cat.label}</span>
                  </button>
               ))}
            </section>

            {/* Quick Setup Guides */}
            <section>
               <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-4">Quick Setup Guides</h3>
               <div className="flex gap-4 overflow-x-auto no-scrollbar">
                  <div className="shrink-0 w-64 bg-secondary text-white p-6 rounded-[32px] shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 size-24 bg-primary/20 blur-2xl rounded-full"></div>
                     <h4 className="text-lg font-black leading-tight mb-2 uppercase tracking-tighter">Setting up Wallet</h4>
                     <p className="text-[10px] font-bold text-white/60 uppercase mb-6">4 Simple Steps</p>
                     <button className="h-10 px-5 bg-primary text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest">Start Guide</button>
                  </div>
                  <div className="shrink-0 w-64 bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft">
                     <h4 className="text-lg font-black text-secondary dark:text-white leading-tight mb-2 uppercase tracking-tighter">Tracking Orders</h4>
                     <p className="text-[10px] font-bold text-gray-400 uppercase mb-6">Live GPS Tutorial</p>
                     <button className="h-10 px-5 bg-gray-100 dark:bg-white/5 text-secondary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200">View Video</button>
                  </div>
               </div>
            </section>

            {/* FAQ List */}
            <section className="space-y-4">
               <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Common Questions</h3>
               <div className="flex flex-col gap-3">
                  {filteredFaqs.map((faq, i) => (
                     <details key={i} className="bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm group">
                        <summary className="flex items-center justify-between cursor-pointer list-none">
                           <h4 className="text-sm font-bold text-secondary dark:text-white uppercase tracking-tight pr-4">{faq.q}</h4>
                           <span className="material-symbols-outlined text-gray-300 group-open:rotate-180 transition-transform">expand_more</span>
                        </summary>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed border-t border-gray-50 dark:border-white/5 pt-3">
                           {faq.a}
                        </p>
                     </details>
                  ))}
               </div>
            </section>

            {/* Contact Support */}
            <section className="bg-primary/5 rounded-[40px] p-8 border border-primary/20 text-center space-y-6 mb-10">
               <div className="size-20 rounded-[32px] bg-primary flex items-center justify-center text-secondary mx-auto shadow-primary-glow">
                  <span className="material-symbols-outlined text-[48px] font-black">support_agent</span>
               </div>
               <div>
                  <h4 className="text-2xl font-black text-secondary dark:text-white tracking-tighter">Priority Human Support</h4>
                  <p className="text-xs font-medium text-gray-500 mt-2 uppercase tracking-widest">Available 24/7 for our community</p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  <button
                     onClick={() => openExternalLink(getWhatsAppLink())}
                     className="h-16 bg-secondary text-primary rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl cursor-pointer"
                  >
                     <span className="material-symbols-outlined">forum</span>
                     Start Support Chat
                  </button>

                  <div className="flex gap-2">
                     <button
                        onClick={() => openExternalLink(getWhatsAppLink())}
                        className="flex-1 h-16 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                     >
                        <span className="material-symbols-outlined text-xl">chat</span>
                        WhatsApp
                     </button>
                     <a
                        href={getTelLink()}
                        className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                     >
                        <span className="material-symbols-outlined text-xl">call</span>
                        Hotline
                     </a>
                  </div>
               </div>
            </section>
         </main>
      </div>
   );
};

export default HelpCenter;