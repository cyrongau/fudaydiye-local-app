
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import DocumentModal from '../components/DocumentModal';

const ClientInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'UNPAID'>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const invoices = [
    { id: 'INV-2024-001', date: 'Oct 12, 2023', amount: '$420.50', status: 'PAID', items: 14 },
    { id: 'INV-2024-002', date: 'Oct 05, 2023', amount: '$125.00', status: 'UNPAID', items: 5 },
    { id: 'INV-2024-003', date: 'Sept 28, 2023', amount: '$890.00', status: 'PAID', items: 32 },
    { id: 'INV-2024-004', date: 'Sept 15, 2023', amount: '$54.00', status: 'PAID', items: 2 },
  ];

  const filtered = filter === 'ALL' ? invoices : invoices.filter(inv => inv.status === 'UNPAID');

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 py-5 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-secondary dark:text-primary">Invoices</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Billing History</p>
        </div>
        <button className="size-11 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 active:scale-95 transition-all">
           <span className="material-symbols-outlined">download</span>
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar">
        {/* Outstanding Balance Banner */}
        <section className="bg-red-500 text-white rounded-[32px] p-7 shadow-xl relative overflow-hidden flex items-center justify-between group">
           <div className="absolute top-0 right-0 size-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Unpaid Dues</h3>
              <div className="text-4xl font-black tracking-tighter">$125.00</div>
           </div>
           <button className="relative z-10 bg-white text-red-500 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
             Pay Now
           </button>
        </section>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          {(['ALL', 'UNPAID'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f 
                ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' 
                : 'text-gray-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Invoice List */}
        <div className="flex flex-col gap-4">
           {filtered.map(inv => (
             <div key={inv.id} className="bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-soft group hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4">
                      <div className={`size-11 rounded-xl flex items-center justify-center ${inv.status === 'PAID' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                         <span className="material-symbols-outlined">{inv.status === 'PAID' ? 'receipt' : 'priority_high'}</span>
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1">{inv.id}</h4>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{inv.date}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-secondary dark:text-white">{inv.amount}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{inv.items} Shipments</p>
                   </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                   <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                     inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                   }`}>
                     {inv.status}
                   </span>
                   <button 
                    onClick={() => setSelectedDoc({ id: inv.id, date: inv.date, amount: inv.amount, vendor: 'Enterprise Logistics Hub' })}
                    className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all"
                   >
                     View PDF <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                   </button>
                </div>
             </div>
           ))}
        </div>
      </main>

      <DocumentModal 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
        type="INVOICE" 
        data={selectedDoc || {}} 
      />

      <BottomNav items={[
        { label: 'Shipments', icon: 'package_2', path: '/client' },
        { label: 'Analytics', icon: 'monitoring', path: '/client/analytics' },
        { label: 'Invoices', icon: 'payments', path: '/client/invoices' },
        { label: 'Support', icon: 'support_agent', path: '/client/support' },
      ]} />
    </div>
  );
};

export default ClientInvoices;
