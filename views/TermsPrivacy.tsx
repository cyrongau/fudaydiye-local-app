
import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsPrivacy: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Platform Usage',
      content: 'Fudaydiye provides a marketplace and logistics network for verified merchants and customers. By using our services, you agree to comply with Somaliland commercial laws and our internal community standards.'
    },
    {
      title: '2. Data Protection',
      content: 'We take your privacy seriously. Your phone number and payment data are encrypted using SHA-256 protocols. We never share your personal information with third-party promoters without explicit consent.'
    },
    {
      title: '3. Logistics & Delivery',
      content: 'Our express delivery service depends on hub availability and traffic conditions. Fudaydiye is not liable for delays caused by force majeure events or hub maintenance schedules.'
    },
    {
      title: '4. Refund & Disputes',
      content: 'All marketplace disputes are initially analyzed by our AI Dispute Intelligence system. Final resolutions are handled by human administrators within 24-48 hours.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-white tracking-tighter leading-none uppercase">Legal Center</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Privacy & Terms</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-20 no-scrollbar animate-in fade-in duration-500">
        <section className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/5">
           <div className="absolute top-0 right-0 size-48 bg-primary/20 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-primary/30 transition-all duration-700"></div>
           <div className="relative z-10">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Agreement Notice</h3>
              <h2 className="text-3xl font-black tracking-tighter leading-tight mb-4">Your Trust is our Priority</h2>
              <p className="text-xs font-medium text-white/70 leading-relaxed uppercase tracking-widest">
                 Last Updated: October 24, 2023 <br/>
                 Hargeisa, Somaliland
              </p>
           </div>
        </section>

        <section className="space-y-10">
           {sections.map(sec => (
             <div key={sec.title} className="space-y-4">
                <h3 className="text-lg font-black text-secondary dark:text-white tracking-tight uppercase border-b-2 border-primary w-fit pr-8 pb-1">{sec.title}</h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-loose">
                   {sec.content}
                </p>
             </div>
           ))}
        </section>

        <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/10 text-center space-y-4 mb-10">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              This document is legally binding. Continued use of Fudaydiye constitutes acceptance of these terms. For a signed copy, contact our legal hub.
           </p>
           <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download Master PDF
           </button>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-5 pb-8">
        <div className="max-w-lg mx-auto flex gap-3">
           <button className="flex-1 h-14 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500">I Disagree</button>
           <button onClick={() => navigate(-1)} className="flex-[2] h-14 bg-primary text-secondary rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">I Accept All Terms</button>
        </div>
      </footer>
    </div>
  );
};

export default TermsPrivacy;
