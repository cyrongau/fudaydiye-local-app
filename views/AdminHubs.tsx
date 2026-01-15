
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AdminHubs: React.FC = () => {
  const navigate = useNavigate();
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newHub, setNewHub] = useState({
    name: '',
    location: '',
    capacity: '2k pkgs/day',
    status: 'ACTIVE' as const,
    load: 10
  });

  const fetchHubs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "hubs"));
      const snapshot = await getDocs(q);
      const hubList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (hubList.length > 0) {
        setHubs(hubList);
      } else {
        setHubs([]);
      }
    } catch (e) {
      console.error("Hub fetch error:", e);
      setHubs([]);
    } finally {
      setLoading(false);
    }
  };

  // 1. Sync Platform Hubs
  useEffect(() => {
    fetchHubs();
  }, []);

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addDoc(collection(db, "hubs"), {
        ...newHub,
        riders: 0,
        efficiency: '100%',
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewHub({ name: '', location: '', capacity: '2k pkgs/day', status: 'ACTIVE', load: 10 });
      fetchHubs();
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  const updateStrain = async (id: string, current: number) => {
    const next = Math.min(100, Math.max(0, current + (Math.random() > 0.5 ? 5 : -5)));
    try {
      await updateDoc(doc(db, "hubs", id), { load: next });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Infrastructure</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Network Capacity</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="size-10 rounded-full bg-primary text-secondary flex items-center justify-center shadow-primary-glow"
        >
          <span className="material-symbols-outlined font-black">add_location_alt</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar animate-in fade-in duration-500">
        <section className="bg-secondary text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/10">
          <div className="absolute top-0 right-0 size-48 bg-primary/20 blur-[60px] rounded-full translate-x-1/4 -translate-y-1/4"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Mesh Global Metrics</h3>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 backdrop-blur-md">
              <span className="text-[9px] font-black uppercase text-primary tracking-widest">Active Monitoring</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div>
              <span className="text-5xl font-black tracking-tighter">{hubs.length || 0}</span>
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-2 leading-tight">Total Hub Nodes</p>
            </div>
            <div>
              <span className="text-5xl font-black tracking-tighter">
                {hubs.length > 0 ? Math.round(hubs.reduce((acc, h) => acc + (h.load || 0), 0) / hubs.length) : 0}<span className="text-primary">%</span>
              </span>
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-2 leading-tight">Avg Network Load</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Logistics Nodes</h3>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
          ) : hubs.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <span className="material-symbols-outlined text-5xl block mb-4">wrong_location</span>
              <p className="text-xs font-black uppercase tracking-widest">No infrastructure nodes detected</p>
            </div>
          ) : (
            hubs.map(hub => (
              <div key={hub.id} className="bg-white dark:bg-surface-dark rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-soft p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-5">
                    <div className={`size-14 rounded-2xl flex items-center justify-center shadow-lg ${hub.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' : 'bg-amber-50 text-amber-600'
                      }`}>
                      <span className="material-symbols-outlined text-[32px]">hub</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-secondary dark:text-white leading-tight uppercase tracking-tighter">{hub.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{hub.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{hub.efficiency || '0%'}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Efficiency</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                    <span>Strain Level</span>
                    <span className={hub.load > 80 ? 'text-red-500 animate-pulse' : ''}>{hub.load}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden cursor-pointer" onClick={() => updateStrain(hub.id, hub.load)}>
                    <div className={`h-full transition-all duration-[1s] ${hub.load > 80 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${hub.load}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-secondary dark:text-white uppercase tracking-widest">{hub.riders || 0} Online Riders</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-primary text-[10px] font-black uppercase tracking-widest px-3 h-8 rounded-lg bg-primary/5 border border-primary/20">Optimize</button>
                      <button className="size-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-sm">settings</span></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add Hub Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center mb-8">
              <div className="size-16 rounded-[22px] bg-secondary text-primary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[32px] font-black">add_location_alt</span>
              </div>
              <h2 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">New Infrastructure</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">Deploy logistics node</p>
            </div>

            <form onSubmit={handleAddHub} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Hub Identifier</label>
                <input required value={newHub.name} onChange={e => setNewHub({ ...newHub, name: e.target.value })} className="w-full h-12 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 text-sm font-bold" placeholder="e.g. Hargeisa South-West" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Location Zone</label>
                <input required value={newHub.location} onChange={e => setNewHub({ ...newHub, location: e.target.value })} className="w-full h-12 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 text-sm font-bold" placeholder="e.g. Kaaba Area" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Daily Throughput Capacity</label>
                <input required value={newHub.capacity} onChange={e => setNewHub({ ...newHub, capacity: e.target.value })} className="w-full h-12 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 text-sm font-bold" placeholder="e.g. 5k pkgs/day" />
              </div>

              <button
                disabled={isSaving}
                type="submit"
                className="w-full h-16 bg-primary text-secondary font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg active:scale-95 transition-all mt-6 flex items-center justify-center gap-3"
              >
                {isSaving ? <span className="animate-spin material-symbols-outlined">sync</span> : 'Initialize Global Node'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav items={[
        { label: 'Overview', icon: 'dashboard', path: '/admin' },
        { label: 'Audits', icon: 'security', path: '/admin/audits' },
        { label: 'Hubs', icon: 'hub', path: '/admin/hubs' },
        { label: 'Config', icon: 'settings', path: '/admin/settings' },
      ]} />
    </div>
  );
};

export default AdminHubs;
