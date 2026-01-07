
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

      <main className="flex-1 p-6 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar">
        {/* Cost Optimization Card */}
        <section className="bg-secondary text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Total Logistics Spend</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter leading-none">$2,142<span className="text-primary text-2xl font-bold">.80</span></span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">MTD</span>
            </div>
            
            <div className="mt-8 flex items-center justify-between bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
               <div>
                 <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Savings from Hub Optimization</p>
                 <span className="text-lg font-black text-primary">+$182.40</span>
               </div>
               <span className="material-symbols-outlined text-primary text-4xl opacity-40">trending_up</span>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           <AnalyticsStat label="Success Rate" value="98.2%" sub="Last 30 days" icon="verified" color="text-green-500" />
           <AnalyticsStat label="Avg Dispatch" value="42m" sub="Pickup time" icon="schedule" color="text-blue-500" />
        </div>

        {/* Dispatch Volume Chart */}
        <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Dispatch Volume</h3>
              <div className="flex gap-1">
                 {['W', 'M', 'Y'].map(t => (
                   <button key={t} className={`size-7 rounded-lg text-[9px] font-black flex items-center justify-center ${t === 'M' ? 'bg-primary text-secondary' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>{t}</button>
                 ))}
              </div>
           </div>
           
           <div className="h-40 flex items-end gap-3 px-1">
              {[40, 70, 35, 90, 50, 60, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-1000 ${i === 6 ? 'bg-primary shadow-primary-glow' : 'bg-gray-100 dark:bg-white/5'}`} 
                    style={{ height: `${h}%` }}
                  ></div>
                  <span className="text-[8px] font-black text-gray-400 uppercase">Day {i+1}</span>
                </div>
              ))}
           </div>
        </section>

        {/* Performance Heatmap Suggestion */}
        <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                 <span className="material-symbols-outlined text-3xl">map</span>
              </div>
              <div>
                 <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1">Destination Hotspots</h4>
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Hargeisa Center leads at 62%</p>
              </div>
           </div>
           <span className="material-symbols-outlined text-gray-300">chevron_right</span>
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
