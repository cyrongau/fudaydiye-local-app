
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const ClientAnalytics: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 py-5 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-secondary dark:text-primary">Analytics</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Operational Metrics</p>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto pb-32 no-scrollbar">
        <div className="size-24 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-gray-300">bar_chart_off</span>
        </div>
        <h2 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-2">No Data Available</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[200px]">Analytics will appear here once you start shipping.</p>
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

const AnalyticsStat: React.FC<{ label: string; value: string; sub: string; icon: string; color: string }> = ({ label, value, sub, icon, color }) => (
  <div className="bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-soft">
    <div className={`size-10 rounded-xl flex items-center justify-center mb-4 ${color.replace('text-', 'bg-')}/10 ${color}`}>
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
    </div>
    <div className="text-2xl font-black text-secondary dark:text-white tracking-tighter mb-1">{value}</div>
    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</div>
    <div className="text-[8px] font-bold text-primary mt-2 uppercase">{sub}</div>
  </div>
);

export default ClientAnalytics;
