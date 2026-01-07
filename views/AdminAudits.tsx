
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { AuditService } from '../lib/auditService';
import { AuditLog } from '../types';
import SystemAlert from '../components/SystemAlert';

const AdminAudits: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS' }>({ isOpen: false, title: '', message: '', type: 'INFO' });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await AuditService.getLogs(50);
    setLogs(data);
    setLoading(false);
  };

  const runAIScan = async () => {
    setIsScanning(true);
    const risks = await AuditService.runSecurityScan();
    setScanResults(risks);
    setIsScanning(false);
    if (risks.length > 0) {
      setAlertConfig({
        isOpen: true,
        title: 'System Anomalies Detected',
        message: `AI Sentinel found ${risks.length} security risks requiring attention.`,
        type: 'WARNING'
      });
    } else {
      setAlertConfig({
        isOpen: true,
        title: 'System Secure',
        message: 'All internal protocols operating within normal parameters.',
        type: 'SUCCESS'
      });
    }
  };

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.severity === filter);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <SystemAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none">Security Command</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Real-time Platform Audit</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">

        {/* AI Sentinel Control */}
        <section className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 size-64 bg-primary/10 blur-[80px] rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">security_update_warning</span>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">AI System Sentinel</h3>
              </div>
              <p className="text-2xl font-black tracking-tighter leading-none mb-1">Internal Integrity Check</p>
              <p className="text-xs text-white/50 max-w-sm">Automated analysis of vendor nodes, data leaks, and compliance anomalies.</p>
            </div>
            <button
              onClick={runAIScan}
              disabled={isScanning}
              className="h-12 px-6 rounded-xl bg-primary text-secondary font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <><span className="size-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></span> Scanning Mesh...</>
              ) : (
                <><span className="material-symbols-outlined text-[16px]">radar</span> Run System Audit</>
              )}
            </button>
          </div>

          {/* Scan Results */}
          {scanResults.length > 0 && (
            <div className="mt-8 grid gap-3 animate-in fade-in slide-in-from-top-4">
              {scanResults.map((risk, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                  <span className={`material-symbols-outlined text-[20px] mt-0.5 ${risk.level === 'CRITICAL' ? 'text-red-500' : 'text-amber-400'}`}>error</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${risk.level === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-400 text-black'}`}>{risk.level}</span>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{risk.section}</span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed">{risk.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Global Filter */}
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                  ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm'
                  : 'text-gray-400'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Live Audit Log */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Immutable Ledger</h3>
            <button onClick={loadLogs} className="flex items-center gap-1.5 text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[14px]">refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-10 opacity-30 text-xs font-black uppercase tracking-widest">No logs found in current scope</div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="bg-white dark:bg-surface-dark p-5 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft group hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${log.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                      log.severity === 'HIGH' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-400'
                    }`}>
                    <span className="material-symbols-outlined text-[24px]">
                      {log.action === 'SUSPEND' ? 'block' :
                        log.action === 'LOGIN' ? 'login' :
                          log.action === 'SYSTEM_CHECK' ? 'radar' : 'article'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {/* Format Timestamp if it's a Firestore Timestamp */}
                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                      </span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${log.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                          log.severity === 'HIGH' ? 'bg-amber-400 text-black' :
                            log.severity === 'MEDIUM' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 dark:bg-white/5 text-gray-500'
                        }`}>
                        {log.severity}
                      </span>
                    </div>
                    <p className={`text-sm font-bold leading-relaxed tracking-tight ${log.severity === 'CRITICAL' ? 'text-red-500' : 'text-secondary dark:text-white'}`}>
                      {log.action}: {log.details}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">Actor: {log.actorName || log.actorId}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav items={[
        { label: 'Overview', icon: 'dashboard', path: '/admin' },
        { label: 'Audits', icon: 'security', path: '/admin/audits' },
        { label: 'Hubs', icon: 'hub', path: '/admin/hubs' },
        { label: 'Config', icon: 'settings', path: '/admin/settings' },
      ]} />
    </div>
  );
};

export default AdminAudits;
