
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../Providers';
import { LiveSaleSession } from '../types';
// Fixed error: Added missing BottomNav import
import BottomNav from '../components/BottomNav';

const VendorLiveSessions: React.FC = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [sessions, setSessions] = useState<LiveSaleSession[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!user) return;
      const q = query(collection(db, "live_sessions"), where("vendorId", "==", user.uid), orderBy("createdAt", "desc"), limit(50));
      const unsub = onSnapshot(q, (snap) => {
         setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveSaleSession)));
         setLoading(false);
      });
      return () => unsub();
   }, [user]);

   const activeSessions = sessions.filter(s => s.status === 'LIVE' || s.status === 'SCHEDULED');
   const pastSessions = sessions.filter(s => s.status === 'ENDED');

   return (
      <div className="flex flex-col h-full animate-in fade-in duration-700 font-display">
         <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div>
               <h1 className="text-4xl font-black text-secondary dark:text-white tracking-tighter uppercase leading-none">Broadcast History</h1>
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-3">Interactive Performance Logs</p>
            </div>
            <button onClick={() => navigate('/vendor/live-setup')} className="h-16 px-10 bg-primary text-secondary rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center gap-3">
               <span className="material-symbols-outlined">add_circle</span> New Session
            </button>
         </header>

         <main className="space-y-12">
            {/* Queue Nodes */}
            {activeSessions.length > 0 && (
               <section className="space-y-6">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-2">Active & Upcoming Nodes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {activeSessions.map(session => (
                        <div key={session.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft flex flex-col gap-6 group hover:border-primary/20 transition-all">
                           <div className="flex justify-between items-start">
                              <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${session.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-100 text-amber-700'}`}>
                                 {session.status}
                              </div>
                              {session.isFeatured && <span className="bg-primary text-secondary text-[8px] font-black px-2 py-0.5 rounded uppercase">FEATURED</span>}
                           </div>
                           <div>
                              <h4 className="text-base font-black text-secondary dark:text-white uppercase truncate">{session.title}</h4>
                              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                 {session.status === 'SCHEDULED' ? `Scheduled: ${new Date(session.scheduledAt?.seconds * 1000).toLocaleString()}` : 'Broadcast Active'}
                              </p>
                           </div>
                           <button onClick={() => navigate(`/vendor/live-cockpit/${session.id}`)} className="w-full h-11 bg-secondary text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
                              <span className="material-symbols-outlined text-[18px]">play_arrow</span> Start Interface
                           </button>
                        </div>
                     ))}
                  </div>
               </section>
            )}

            {/* Historical Table */}
            <section className="bg-white dark:bg-surface-dark rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden">
               <div className="p-8 border-b border-gray-50 dark:border-white/2 bg-gray-50/50 dark:bg-white/2">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Broadcast Archive</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-gray-50 dark:border-white/5 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                           <th className="py-5 px-8">Session Identity</th>
                           <th className="py-5 px-6">Peak Reach</th>
                           <th className="py-5 px-6">Date</th>
                           <th className="py-5 px-8 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 dark:divide-white/2">
                        {loading ? <tr><td colSpan={4} className="py-20 text-center uppercase font-black text-[10px]">Syncing Archive...</td></tr> :
                           pastSessions.length === 0 ? <tr><td colSpan={4} className="py-20 text-center opacity-30 uppercase font-black text-[10px]">No historical data found</td></tr> :
                              pastSessions.map(session => (
                                 <tr key={session.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                                    <td className="py-6 px-8">
                                       <div className="flex items-center gap-4">
                                          <img src={session.featuredProductImg} className="size-12 rounded-xl object-cover grayscale opacity-50" alt="" />
                                          <div>
                                             <p className="text-sm font-black text-secondary dark:text-white uppercase truncate max-w-[200px]">{session.title}</p>
                                             <p className="text-[9px] font-bold text-gray-400 uppercase">{session.category}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-6 px-6">
                                       <span className="text-sm font-black text-secondary dark:text-white">{session.peakViewers || session.viewerCount || 0}</span>
                                    </td>
                                    <td className="py-6 px-6">
                                       <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(session.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                       <button onClick={() => navigate(`/admin/live-moderation?view=${session.id}`)} className="size-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary transition-all shadow-sm">
                                          <span className="material-symbols-outlined">analytics</span>
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                     </tbody>
                  </table>
               </div>
            </section>
         </main>
         <BottomNav />
      </div>
   );
};

export default VendorLiveSessions;
