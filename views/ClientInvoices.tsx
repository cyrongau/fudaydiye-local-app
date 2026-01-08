
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import DocumentModal from '../components/DocumentModal';

const ClientInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'UNPAID'>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);



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

      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto pb-32 no-scrollbar">
        <div className="size-24 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-gray-300">receipt_long</span>
        </div>
        <h2 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-2">No Invoices Found</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[200px]">You have no pending or paid invoices at this time.</p>
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
