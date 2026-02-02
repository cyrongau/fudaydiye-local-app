
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../src/services/api';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import HeaderNotification from '../components/HeaderNotification';
import { useAuth } from '../Providers';

const AdminPlatformOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [stats, setStats] = useState({
    gmv: 0,
    growth: 0,
    retention: 0,
    shoppers: 0,
    vendors: 0,
    riders: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Analytics Stats
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        const data = res.data;
        setStats({
          gmv: data.totalRevenue || 0,
          growth: 0,
          retention: 0,
          shoppers: data.totalCustomers || 0,
          vendors: data.totalVendors || 0,
          riders: data.totalRiders || 0
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      }
    };

    fetchStats();

    // 2. Real System Logs
    const unsubLogs = onSnapshot(query(collection(db, "system_logs"), orderBy("createdAt", "desc"), limit(5)), (snap) => {
      setRecentLogs(snap.docs.map(d => d.data()));
    });

    return () => unsubLogs();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleLogout = async () => {
    const { auth } = await import('../lib/firebase');
    await auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-black pb-[calc(var(--bottom-nav-height)+2rem)] font-display">
      {/* Header */}
      <div className="bg-white dark:bg-surface-dark px-8 py-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 dark:border-white/5">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-white mb-1">System Health</h1>
          <p className="text-sm text-gray-400 font-medium">Global Platform Pulse & Real-time Metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-500">System Online</span>
            </div>
          </div>
          <HeaderNotification />

          {/* Functional Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="size-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100 ring-2 ring-white dark:ring-black flex items-center justify-center text-gray-500 font-bold focus:outline-none transition-transform active:scale-95"
            >
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'A'}</span>
              )}
            </button>

            {isProfileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/5 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-gray-50 dark:border-white/5 text-left">
                  <p className="text-xs font-black text-secondary dark:text-white truncate">{profile?.fullName || 'Admin'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{profile?.email}</p>
                </div>
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 uppercase tracking-wider"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-white/5 uppercase tracking-wider"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">

        {/* Top Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. GMV Card (Main Blue) */}
          <div className="bg-[#2B6CB0] text-white p-6 rounded-[24px] relative overflow-hidden shadow-lg shadow-blue-900/10 h-40">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-xl">payments</span>
                </div>
                <span className="material-symbols-outlined text-white/40">trending_up</span>
              </div>
              <div>
                <p className="text-sm font-medium opacity-80 mb-1">Platform GMV</p>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl font-black">{formatCurrency(stats.gmv)}</h2>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">+5.4%</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 size-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-10 size-20 bg-blue-400/20 rounded-full blur-xl"></div>
          </div>

          {/* 2. Vendors Card (White/Surface) */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm h-40">
            <div className="flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="size-10 bg-[#fff5eb] text-orange-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">storefront</span>
                </div>
                <span className="material-symbols-outlined text-gray-300">more_horiz</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Active Vendors</p>
                <h2 className="text-3xl font-black text-secondary dark:text-white">{stats.vendors}</h2>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">Growth rate: <span className="text-green-500 font-bold">+12%</span></p>
              </div>
            </div>
          </div>

          {/* 3. Shoppers Card (White/Surface) */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-sm h-40">
            <div className="flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="size-10 bg-[#eef2ff] text-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">person</span>
                </div>
                <span className="material-symbols-outlined text-gray-300">more_horiz</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Active Shoppers</p>
                <h2 className="text-3xl font-black text-secondary dark:text-white">{stats.shoppers}</h2>
                <div className="mt-2 w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-2/3 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Module Status Column */}
          <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-gray-100 dark:border-white/5 p-6 shadow-sm flex flex-col gap-6">
            <h3 className="text-lg font-black text-secondary dark:text-white">Infrastructure Integrity</h3>
            <div className="space-y-4">
              <ModuleStatus label="Marketplace Engine" status="ONLINE" ping="4ms" health={100} />
              <ModuleStatus label="Logistics Mesh" status="ONLINE" ping="12ms" health={98} />
              <ModuleStatus label="Live Video Nodes" status="ONLINE" ping="24ms" health={100} />
              <ModuleStatus label="Escrow Protocol" status="ONLINE" ping="4ms" health={100} />
              <div className="h-px bg-gray-50 dark:bg-white/5 my-2"></div>
              <button onClick={() => navigate('/admin/report')} className="w-full py-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-wide transition-colors">
                Generate Audit Report
              </button>
            </div>
          </div>

          {/* Main Activity Log */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-[24px] border border-gray-100 dark:border-white/5 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-secondary dark:text-white">Security Audit Log</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] font-bold uppercase text-gray-400 hover:text-primary transition-colors">Export</button>
                <button className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] font-bold uppercase text-gray-400 hover:text-primary transition-colors">Clear</button>
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, idx) => (
                  <AuditItem
                    key={idx}
                    type={log.type || "SYSTEM"}
                    text={log.message || "System Event"}
                    time="Just now"
                    user={log.userId || "System"}
                    level={log.level || "INFO"}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">dns</span>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Log Stream Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModuleStatus: React.FC<{ label: string; status: string; ping: string; health: number; warning?: boolean }> = ({ label, status, ping, health, warning }) => (
  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-default group">
    <div className="flex items-center gap-3">
      <div className={`size-2.5 rounded-full ${warning ? 'bg-amber-500' : 'bg-green-500'} animate-pulse shadow-sm shadow-green-500/50`}></div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-secondary dark:text-white leading-none mb-1">{label}</span>
        <span className="text-[10px] font-medium text-gray-400 font-mono">{ping}</span>
      </div>
    </div>
    <div className="text-right">
      <span className={`text-xs font-black ${health < 95 ? 'text-amber-500' : 'text-green-600'} bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all`}>{health}%</span>
    </div>
  </div>
);

const AuditItem: React.FC<{ type: string; text: string; time: string; user: string; level: 'CRITICAL' | 'INFO' | 'SUCCESS' }> = ({ type, text, time, user, level }) => (
  <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5">
    <div className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${level === 'CRITICAL' ? 'bg-red-50 text-red-600' :
      level === 'SUCCESS' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
      }`}>
      <span className="material-symbols-outlined text-xl">
        {level === 'CRITICAL' ? 'security' : level === 'SUCCESS' ? 'check_circle' : 'info'}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{type}</span>
        <span className="text-[10px] font-medium text-gray-400">{time}</span>
      </div>
      <p className="text-sm font-bold text-secondary dark:text-white truncate mb-0.5">{text}</p>
      <p className="text-[11px] font-medium text-gray-400">User: <span className="text-secondary dark:text-gray-300">{user}</span></p>
    </div>
  </div>
);

export default AdminPlatformOverview;