
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../Providers';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

const RiderJobAssignmentList: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [assignments, setAssignments] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);

  const handleRejectConfirm = async () => {
    if (!rejectingJobId || !user) return;
    try {
      await import('../src/lib/services/riderService').then(m => m.RiderService.cancelJob(rejectingJobId, user.uid));
      fetchAssignments();
    } catch (e) { alert("Failed to cancel"); }
  };



  useEffect(() => {
    if (!user) return;

    fetchAssignments();
  }, [user?.uid]);

  const fetchAssignments = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "orders"),
        where("riderId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAssignments(fetched);
    } catch (err) {
      console.error("Assignment Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SHIPPED': return 'bg-blue-500';
      case 'ACCEPTED': return 'bg-amber-500';
      case 'DELIVERED': return 'bg-primary';
      case 'PACKING': return 'bg-secondary';
      default: return 'bg-gray-400';
    }
  };

  const activeJobs = assignments.filter(a => a.status !== 'DELIVERED');
  const completedJobs = assignments.filter(a => a.status === 'DELIVERED');
  const displayList = activeTab === 'ACTIVE' ? activeJobs : completedJobs;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-secondary dark:text-white tracking-tighter uppercase">Assignments</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Operational Queue</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAssignments()}
            className="size-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center active:bg-gray-200"
          >
            <span className="material-symbols-outlined text-secondary dark:text-white text-lg">refresh</span>
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">On Duty</span>
            <span className="text-xs font-bold text-secondary dark:text-white truncate max-w-[100px]">{profile?.fullName || 'Captain'}</span>
          </div>
          <img src={profile?.avatar || `https://ui-avatars.com/api/?name=Rider&background=015754&color=06DC7F`} className="size-11 rounded-2xl border-2 border-primary/20 shadow-soft object-cover" alt="Profile" />
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-32 no-scrollbar">
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ACTIVE'
              ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm'
              : 'text-gray-400'
              }`}
          >
            Active ({activeJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY'
              ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm'
              : 'text-gray-400'
              }`}
          >
            History ({completedJobs.length})
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 text-secondary dark:text-white text-center">
            <span className="material-symbols-outlined text-6xl mb-4">assignment_late</span>
            <p className="text-xs font-black uppercase tracking-widest">No {activeTab.toLowerCase()} assignments detected</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {displayList.map((job) => (
              <div key={job.id} className="bg-white dark:bg-surface-dark rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden group">
                <div className={`h-1.5 w-full ${getStatusColor(job.status)}`}></div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-10"> {/* Increased margin bottom below the product header */}
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-secondary dark:text-white relative shadow-inner overflow-hidden mb-2"> {/* Added mb-2 for spacing inside card */}
                        <img src={job.items[0]?.img || 'https://picsum.photos/200'} className="w-full h-full object-cover" alt="Product" />
                        <div className="absolute inset-0 bg-black/10"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-secondary dark:text-white leading-none uppercase">#{job.orderNumber}</h4>
                          {job.isAtomic && <span className="bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">ATOMIC</span>}
                          {job.type === 'LOGISTICS' && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest">Client Order</span>}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{job.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary leading-none tracking-tighter">${job.deliveryFee?.toFixed(2)}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">SLA Fee</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <div className="flex flex-col items-center pt-1.5 w-4 shrink-0">
                      <div className="size-2 rounded-full bg-gray-300"></div>
                      <div className="w-0.5 flex-1 bg-gray-100 dark:bg-white/5 my-1 border-l border-dashed border-gray-300"></div>
                      <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pickup Terminal</p>
                        <p className="text-xs font-bold text-secondary dark:text-white truncate uppercase">{job.vendorName || 'Merchant Hub'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Delivery Node</p>
                        <p className="text-xs font-black text-secondary dark:text-white truncate uppercase">{job.shippingAddress}</p>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'ACTIVE' && (
                    <div className="flex gap-3 pt-6 border-t border-gray-50 dark:border-white/5">
                      <button
                        onClick={() => navigate(`/rider/navigate/${job.id}`)}
                        className="flex-1 h-14 bg-secondary text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all group/btn"
                      >
                        <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-1 transition-transform">near_me</span>
                        Navigate
                      </button>
                      {job.status === 'ACCEPTED' ? (
                        <div className="flex gap-2 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectingJobId(job.id);
                            }}
                            className="w-14 h-14 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl font-black flex items-center justify-center active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                          <button
                            onClick={() => navigate(`/rider/pickup/${job.id}`)}
                            className="flex-1 h-14 bg-primary text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                          >Verify Pickup</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/rider/confirm/${job.id}`)}
                          className="flex-1 h-14 bg-primary text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >Complete Drop</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>



      <ConfirmationModal
        isOpen={!!rejectingJobId}
        onClose={() => setRejectingJobId(null)}
        onConfirm={handleRejectConfirm}
        title="Reject Assignment?"
        message="This will remove the job from your queue and notify the dispatch hub. This action cannot be undone."
        confirmLabel="Reject Job"
        isDestructive={true}
      />

      <BottomNav items={[
        { label: 'Home', icon: 'home', path: '/rider' },
        { label: 'Jobs', icon: 'assignment', path: '/rider/assignments' },
        { label: 'Wallet', icon: 'account_balance_wallet', path: '/rider/wallet' },
        { label: 'Settings', icon: 'settings', path: '/rider/settings' },
      ]} />
    </div >
  );
};

export default RiderJobAssignmentList;
