
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

import StatusModal from '../components/StatusModal';

const AdminLiveSaleModeration: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCHEDULED'>('LIVE');
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'SUCCESS' as 'SUCCESS' | 'ERROR' });

  const showModal = (title: string, message: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
    setModalConfig({ title, message, type });
    setModalOpen(true);
  };

  useEffect(() => {
    let unsub = () => { };
    try {
      const q = query(collection(db, "live_sessions"), orderBy("createdAt", "desc"));
      unsub = onSnapshot(q, (snap) => {
        setStreams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        console.error("Live Streams Fetch Error:", error);
        showModal('Connection Error', `Stream Node Error: ${error.message}`, 'ERROR');
        setLoading(false);
      });
    } catch (e) {
      console.error("Live Stream setup error", e);
      setLoading(false);
    }
    return () => unsub();
  }, []);

  const handleTerminate = async (id: string, vendor: string) => {
    if (window.confirm(`SEVER LINK: Force terminate ${vendor}'s broadcast node? Connected clients will be redirected immediately.`)) {
      try {
        await updateDoc(doc(db, "live_sessions", id), {
          status: 'ENDED',
          endedAt: serverTimestamp(),
          terminatedBy: 'admin'
        });
        showModal('Link Severed', "Node successfully severed from marketplace mesh.");
      } catch (err) { showModal('Operation Failed', "Could not terminate session.", 'ERROR'); }
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "live_sessions", id), { isFeatured: !current });
      showModal('Status Sync', "Node featured status synchronized.");
    } catch (e) { showModal('Sync Failed', "Could not update featured status.", 'ERROR'); }
  };

  const filtered = streams.filter(s => s.status === activeTab);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display">
      <StatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all"><span className="material-symbols-outlined">arrow_back</span></button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Mesh Oversight</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Live Content Moderation</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-32 no-scrollbar">
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 w-fit">
          <button onClick={() => setActiveTab('LIVE')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LIVE' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}>Live Nodes ({streams.filter(s => s.status === 'LIVE').length})</button>
          <button onClick={() => setActiveTab('SCHEDULED')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SCHEDULED' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}>Scheduled ({streams.filter(s => s.status === 'SCHEDULED').length})</button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center opacity-30 text-center">
            <span className="material-symbols-outlined text-6xl mb-4">sensors_off</span>
            <p className="text-xs font-black uppercase tracking-widest">No active {activeTab.toLowerCase()} nodes detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(stream => (
              <div key={stream.id} className="bg-white dark:bg-surface-dark rounded-[48px] border border-gray-100 dark:border-gray-800 shadow-soft overflow-hidden group hover:border-primary/20 transition-all flex flex-col">
                <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                  <img src={stream.featuredProductImg} className="w-full h-full object-cover grayscale-[30%] opacity-40 group-hover:scale-105 transition-transform duration-[10s]" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className={`${stream.status === 'LIVE' ? 'bg-red-600' : 'bg-amber-100 text-amber-700'} text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-xl border border-white/10`}>
                      <span className={`size-1.5 rounded-full ${stream.status === 'LIVE' ? 'bg-white animate-pulse' : 'bg-amber-600'}`}></span>
                      {stream.status}
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white font-black text-lg leading-tight uppercase tracking-tighter mb-1 truncate">{stream.title}</h3>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Vendor: {stream.vendorName}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                    <span>Viewer Pulse</span>
                    <span className="text-secondary dark:text-white">{stream.viewerCount || 0} Connected</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => navigate(`/customer/live/${stream.id}?observer=true`)} className="flex-1 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 dark:border-white/10 active:scale-95 transition-all">Inspect Feed</button>
                    <button onClick={() => toggleFeatured(stream.id, stream.isFeatured || false)} className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all ${stream.isFeatured ? 'bg-amber-400 text-white' : 'bg-secondary text-primary'}`}>
                      {stream.isFeatured ? 'Featured Node' : 'Feature Drop'}
                    </button>
                  </div>
                  <button onClick={() => handleTerminate(stream.id, stream.vendorName)} className="w-full h-12 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all">Sever Link</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminLiveSaleModeration;
