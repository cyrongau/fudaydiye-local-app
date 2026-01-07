
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const ClientSupport: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 py-5 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-secondary dark:text-primary">Help Center</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">24/7 Priority Support</p>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        {/* Support Banner */}
        <section className="bg-primary text-secondary rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-4">Enterprise Concierge</h3>
            <h2 className="text-3xl font-black tracking-tighter leading-tight mb-6">Need help with high-volume dispatch?</h2>
            <button className="w-full h-14 bg-secondary text-primary font-black uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all text-[11px]">
              Start Live Chat
            </button>
          </div>
        </section>

        {/* Support Grid */}
        <div className="grid grid-cols-2 gap-4">
           <SupportCategory label="Track Lost Item" icon="location_searching" color="bg-blue-500" />
           <SupportCategory label="Billing Discrepancy" icon="account_balance_wallet" color="bg-amber-500" />
           <SupportCategory label="Rider Feedback" icon="star_rate" color="bg-primary" />
           <SupportCategory label="API Integration" icon="terminal" color="bg-secondary" />
        </div>

        {/* FAQs Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Common Questions</h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest">Browse All</button>
          </div>
          <div className="flex flex-col gap-3">
             <FAQItem title="What is the maximum weight per Bajaj?" text="Bajaj dispatches are capped at 80kg to ensure safety and speed across Hargeisa hubs." />
             <FAQItem title="How long do invoices stay pending?" text="Invoices are issued every Monday and stay pending for 7 business days before late fees apply." />
             <FAQItem title="Can I request Berbera-Burco same-day?" text="Currently, regional express is 24-48 hours. Only inter-city (Hargeisa-Hargeisa) is same-day." />
          </div>
        </section>

        {/* Tickets History Placeholder */}
        <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft text-center py-10">
           <div className="size-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <span className="material-symbols-outlined text-gray-400">history_edu</span>
           </div>
           <p className="text-sm font-black text-secondary dark:text-white uppercase tracking-widest mb-1">No Active Tickets</p>
           <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">All your queries have been resolved</p>
        </section>
      </main>

      <BottomNav items={[
        { label: 'Shipments', icon: 'package_2', path: '/client' },
        { label: 'Analytics', icon: 'monitoring', path: '/client/analytics' },
        { label: 'Invoices', icon: 'payments', path: '/client/invoices' },
        { label: 'Support', icon: 'support_agent', path: '/client/support' },
      ]} />
    </div>
  );
};

const SupportCategory: React.FC<{ label: string; icon: string; color: string }> = ({ label, icon, color }) => (
  <div className="bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-soft flex flex-col items-center text-center gap-3 transition-all active:scale-95 cursor-pointer">
     <div className={`size-12 rounded-2xl flex items-center justify-center ${color} text-white shadow-lg`}>
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
     </div>
     <span className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-widest leading-tight">{label}</span>
  </div>
);

const FAQItem: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="bg-white dark:bg-surface-dark p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm group">
     <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-black text-secondary dark:text-white group-hover:text-primary transition-colors">{title}</h4>
        <span className="material-symbols-outlined text-gray-300 text-[18px]">expand_more</span>
     </div>
     <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">{text}</p>
  </div>
);

export default ClientSupport;
