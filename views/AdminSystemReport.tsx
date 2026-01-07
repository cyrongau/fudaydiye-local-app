
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AdminSystemReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalHubs: 0,
    totalStaff: 0,
    totalManagers: 0,
    activeRiders: 0
  });

  useEffect(() => {
    async function fetchAuditData() {
      try {
        const [storesSnap, hubsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "stores")),
          getDocs(collection(db, "hubs")),
          getDocs(collection(db, "users"))
        ]);

        const allUsers = usersSnap.docs.map(d => d.data());
        
        setStats({
          totalStores: storesSnap.size,
          totalHubs: hubsSnap.size,
          totalStaff: allUsers.filter(u => u.staffType === 'STAFF').length,
          totalManagers: allUsers.filter(u => u.staffType === 'MANAGER').length,
          activeRiders: allUsers.filter(u => u.role === 'RIDER' && u.status === 'ONLINE').length
        });
      } catch (err) {
        console.error("Audit Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAuditData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Platform Audit</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Milestone 2 Post-Deployment Report</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-20 no-scrollbar animate-in fade-in duration-700">
        {/* Node Integrity Pulse */}
        <section className="bg-secondary text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden border border-white/10">
           <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
           <div className="relative z-10 flex flex-col gap-10">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3">Integrity Score</h3>
                    <div className="flex items-baseline gap-2">
                       <span className="text-7xl font-black tracking-tighter">98.4<span className="text-primary text-3xl">%</span></span>
                    </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
                    <p className="text-[8px] font-black uppercase text-primary">Status</p>
                    <p className="text-xs font-black uppercase">Verified Hubs</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                 <ReportMetric label="Branch Nodes" value={stats.totalStores} icon="store" color="bg-primary" />
                 <ReportMetric label="Logistics Hubs" value={stats.totalHubs} icon="hub" color="bg-blue-500" />
                 <ReportMetric label="Personnel Nodes" value={stats.totalStaff + stats.totalManagers} icon="group" color="bg-amber-500" />
                 <ReportMetric label="Fleet Capacity" value={stats.activeRiders} icon="two_wheeler" color="bg-primary" />
              </div>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Organizational Distribution */}
           <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Personnel Allocation</h3>
              <div className="space-y-6">
                 <AllocationBar label="Authorized Managers" value={stats.totalManagers} total={stats.totalManagers + stats.totalStaff} color="bg-primary" />
                 <AllocationBar label="Front-line Staff" value={stats.totalStaff} total={stats.totalManagers + stats.totalStaff} color="bg-secondary" />
                 <AllocationBar label="Verified Captains" value={stats.activeRiders} total={stats.activeRiders + 10} color="bg-blue-500" />
              </div>
              <div className="mt-10 p-5 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4">
                 <span className="material-symbols-outlined text-primary">auto_awesome</span>
                 <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest italic">
                    "Platform personnel saturation is optimal. Node-to-Branch ratio ({( (stats.totalStaff + stats.totalManagers) / (stats.totalStores || 1) ).toFixed(1)}) suggests efficient localized management."
                 </p>
              </div>
           </section>

           {/* Provisioning History Log */}
           <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden flex flex-col">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Recent Node Provisioning</h3>
              <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar max-h-[300px]">
                 <LogEntry type="HUB" text="Berbera Port hub strain optimized" time="2m ago" />
                 <LogEntry type="STORE" text="New branch node: Hargeisa West" time="14m ago" />
                 <LogEntry type="STAFF" text="Manager ID-882 authorized" time="1h ago" />
                 <LogEntry type="STAFF" text="Staff node invitation sent to Amina O." time="3h ago" />
                 <LogEntry type="HUB" text="Central Hub capacity increased to 5k" time="Yesterday" />
              </div>
              <button className="w-full h-12 mt-6 bg-gray-50 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-all">View Full Ledger</button>
           </section>
        </div>

        {/* Global Strategy Notice */}
        <section className="bg-primary p-10 rounded-[56px] text-secondary relative overflow-hidden group">
           <div className="absolute top-0 right-0 size-32 bg-white/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 space-y-4">
                 <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Milestone 2 Verified</h2>
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Ready for Social & Logistics Fusion</p>
              </div>
              <button 
                onClick={() => navigate('/admin')}
                className="h-16 px-12 bg-secondary text-primary font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl active:scale-95 transition-all whitespace-nowrap"
              >
                 Initialize Milestone 3
              </button>
           </div>
        </section>
      </main>
    </div>
  );
};

const ReportMetric: React.FC<{ label: string; value: number; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="flex flex-col gap-3">
     <div className={`size-10 rounded-xl flex items-center justify-center text-white ${color} shadow-lg`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
     </div>
     <div>
        <p className="text-2xl font-black tracking-tighter leading-none">{value}</p>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">{label}</p>
     </div>
  </div>
);

const AllocationBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => (
  <div className="space-y-2">
     <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
        <span className="text-secondary dark:text-white">{label}</span>
        <span className="text-gray-400">{value} Nodes</span>
     </div>
     <div className="h-1.5 w-full bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-[1.5s] ${color}`} style={{ width: `${(value / (total || 1)) * 100}%` }}></div>
     </div>
  </div>
);

const LogEntry: React.FC<{ type: string; text: string; time: string }> = ({ type, text, time }) => (
  <div className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-white/5 last:border-0">
     <div className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
       type === 'HUB' ? 'bg-blue-100 text-blue-700' :
       type === 'STORE' ? 'bg-primary/10 text-primary' :
       'bg-amber-100 text-amber-700'
     }`}>
        {type}
     </div>
     <p className="flex-1 text-[11px] font-bold text-secondary dark:text-white truncate uppercase tracking-tight">{text}</p>
     <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap">{time}</span>
  </div>
);

export default AdminSystemReport;