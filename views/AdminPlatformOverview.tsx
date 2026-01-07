
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPlatformOverview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">System Health</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Global Platform Pulse</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-[calc(var(--bottom-nav-height)+2rem)] no-scrollbar">
        {/* Total Ecosystem Value Display */}
        <section className="bg-secondary text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Cumulative Platform GMV</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-black tracking-tighter leading-none">$2.84<span className="text-primary">M</span></span>
              <span className="text-[10px] font-bold text-white/40 uppercase ml-2 tracking-widest">Lifetime Portfolio</span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Growth (MTD)</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black text-primary">+42.8%</span>
                  <span className="material-symbols-outlined text-primary text-sm animate-bounce">trending_up</span>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Retention</p>
                <span className="text-lg font-black text-white">92.4%</span>
              </div>
            </div>
          </div>
        </section>

        {/* AI Command Center Insight */}
        <section className="bg-primary/5 rounded-[32px] p-6 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <span className="material-symbols-outlined text-primary text-5xl">auto_awesome</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-secondary shadow-lg">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-secondary dark:text-white leading-tight uppercase tracking-tighter">AI Operational Summary</h4>
              <div className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[8px] font-black text-gray-400 uppercase">Analysis Engine Live</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest italic mb-6">
            "Detected a 15% bottleneck in <span className="text-primary font-bold">Hargeisa East</span> logistics. Milestone 2 Staff nodes verified. Recommendation: Review Hub Control Report."
          </p>
          <button
            onClick={() => navigate('/admin/report')}
            className="h-12 bg-secondary text-primary rounded-xl px-6 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">assessment</span>
            Generate System Audit Report
          </button>
        </section>

        {/* User Base Distribution */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Ecosystem Nodes</h3>
            <span className="text-[10px] font-bold text-primary uppercase">Live Counts</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SmallMetric label="Shoppers" value="18.9k" color="bg-blue-500" icon="person" />
            <SmallMetric label="Vendors" value="1.2k" color="bg-primary" icon="storefront" />
            <SmallMetric label="Riders" value="482" color="bg-amber-500" icon="two_wheeler" />
          </div>
        </section>

        {/* Visual Activity Heatmap */}
        <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Marketplace Heatmap</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-red-500"></div>
                <span className="text-[8px] font-bold text-gray-400 uppercase">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-primary"></div>
                <span className="text-[8px] font-bold text-gray-400 uppercase">Steady</span>
              </div>
            </div>
          </div>
          <div className="relative aspect-[16/9] rounded-2xl bg-gray-50 dark:bg-black/20 overflow-hidden border border-gray-100 dark:border-white/5">
            <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f6dfc0f?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 mix-blend-overlay" alt="Map" />
            <div className="absolute top-[20%] left-[30%] size-24 bg-red-500/30 blur-[40px] rounded-full animate-pulse"></div>
            <div className="absolute top-[50%] left-[40%] size-32 bg-primary/30 blur-[40px] rounded-full animate-pulse [animation-delay:0.5s]"></div>
            <div className="absolute top-[40%] left-[70%] size-20 bg-primary/20 blur-[40px] rounded-full animate-pulse [animation-delay:1s]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-white/20">
                <p className="text-[9px] font-black text-secondary dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-red-500 animate-ping">location_searching</span>
                  High Demand in Jigjiga Yar
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Module Health Matrix */}
        <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Infrastructure Integrity</h3>
          <div className="space-y-4">
            <ModuleStatus label="Marketplace Engine" status="STABLE" ping="22ms" health={100} />
            <ModuleStatus label="Logistics Mesh" status="STABLE" ping="45ms" health={99.9} />
            <ModuleStatus label="Live Video Nodes" status="OPTIMAL" ping="118ms" health={98.2} />
            <ModuleStatus label="Escrow Protocol" status="STABLE" ping="15ms" health={100} />
          </div>
        </section>

        {/* Regional Performance */}
        <section className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Regional Distribution</h3>
          <div className="space-y-4">
            <GeoStat city="Hargeisa Region" weight="68%" color="bg-primary" />
            <GeoStat city="Berbera Port" weight="18%" color="bg-blue-500" />
            <GeoStat city="Borama Center" weight="14%" color="bg-amber-500" />
          </div>
        </section>

        {/* Activity Log */}
        <section className="flex flex-col gap-4 mb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Security Audit Log</h3>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest">Full History</button>
          </div>
          <div className="space-y-3">
            <AuditItem
              type="AUTH"
              text="Mass login attempts throttled from IP 42.x.x.x"
              time="3m ago"
              user="System Automaton"
              level="CRITICAL"
            />
            <AuditItem
              type="COMMERCE"
              text="Vendor payout processed: $42,400"
              time="18m ago"
              user="Hargeisa Treasury"
              level="SUCCESS"
            />
            <AuditItem
              type="NETWORK"
              text="New relay node activated in Burco Hub"
              time="1h ago"
              user="DevOps Team"
              level="INFO"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

const SmallMetric: React.FC<{ label: string; value: string; color: string; icon: string }> = ({ label, value, color, icon }) => (
  <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer">
    <div className={`size-8 rounded-xl ${color}/10 flex items-center justify-center ${color.replace('bg-', 'text-')}`}>
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </div>
    <span className="text-sm font-black text-secondary dark:text-white leading-none">{value}</span>
    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
  </div>
);

const ModuleStatus: React.FC<{ label: string; status: string; ping: string; health: number; warning?: boolean }> = ({ label, status, ping, health, warning }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`size-2 rounded-full ${warning ? 'bg-amber-500' : 'bg-primary'} animate-pulse`}></div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-secondary dark:text-white leading-none mb-1 uppercase tracking-wider">{label}</span>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{status} • {ping}</span>
      </div>
    </div>
    <div className="text-right">
      <span className={`text-xs font-black ${health < 95 ? 'text-amber-500' : 'text-primary'}`}>{health}%</span>
    </div>
  </div>
);

const GeoStat: React.FC<{ city: string; weight: string; color: string }> = ({ city, weight, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center px-1">
      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{city}</span>
      <span className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-widest">{weight}</span>
    </div>
    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: weight }}></div>
    </div>
  </div>
);

const AuditItem: React.FC<{ type: string; text: string; time: string; user: string; level: 'CRITICAL' | 'INFO' | 'SUCCESS' }> = ({ type, text, time, user, level }) => (
  <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-3">
    <div className={`size-8 shrink-0 rounded-lg flex items-center justify-center ${level === 'CRITICAL' ? 'bg-red-100 text-red-600' :
      level === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
      }`}>
      <span className="material-symbols-outlined text-[18px]">
        {level === 'CRITICAL' ? 'security_update_warning' : level === 'SUCCESS' ? 'check_circle' : 'info'}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{type} • {time}</span>
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${level === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'
          }`}>
          {level}
        </span>
      </div>
      <p className="text-xs font-bold text-secondary dark:text-white truncate">{text}</p>
      <p className="text-[9px] font-medium text-gray-400 mt-0.5">Origin: {user}</p>
    </div>
  </div>
);

export default AdminPlatformOverview;