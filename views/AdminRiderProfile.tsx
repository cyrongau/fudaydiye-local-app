
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, KYCDocument } from '../types';

const AdminRiderProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rider, setRider] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'VEHICLE' | 'DOCUMENTS'>('IDENTITY');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "users", id), (snap) => {
      if (snap.exists()) setRider({ uid: snap.id, ...snap.data() } as UserProfile);
    });
    return () => unsub();
  }, [id]);

  const updateKycStatus = async (status: 'VERIFIED' | 'REJECTED', docId?: string) => {
    if (!rider || !id) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", id);
      if (docId) {
        const updatedDocs = rider.kycDocuments?.map(d => d.id === docId ? { ...d, status } : d);
        await updateDoc(userRef, { kycDocuments: updatedDocs });
      } else {
        await updateDoc(userRef, { 
          kycStatus: status,
          status: status === 'VERIFIED' ? 'OFFLINE' : 'INACTIVE',
          trustTier: status === 'VERIFIED' ? 'SILVER' : 'BRONZE',
          lastAdminAction: serverTimestamp() 
        });
        alert(status === 'VERIFIED' ? "Captain documents verified. Account is now active." : "Identity verification rejected.");
      }
    } catch (err) { alert("Mesh sync error."); } finally { setIsUpdating(false); }
  };

  const handleAccountAction = async (action: 'SUSPEND' | 'DELETE') => {
    if (!rider || !id) return;
    
    const confirmMsg = action === 'DELETE' 
      ? `CRITICAL: Permanently erase Captain ${rider.fullName} from the ecosystem? This action is irreversible.`
      : `Authorize suspension of Captain ${rider.fullName}? This will block all active dispatches.`;

    if (!window.confirm(confirmMsg)) return;

    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", id);
      if (action === 'DELETE') {
        await deleteDoc(userRef);
        alert("Account purged from database node.");
        navigate('/admin/riders');
      } else {
        await updateDoc(userRef, {
          status: 'SUSPENDED',
          kycStatus: 'REJECTED',
          lastAdminAction: serverTimestamp()
        });
        alert("Node suspended. Access terminated.");
      }
    } catch (err) {
      alert("Operational failure during account modification.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!rider) return <div className="h-screen flex items-center justify-center"><div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Captain Audit</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Personnel ID: {rider.uid.substring(0,8)}</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-64 no-scrollbar animate-in fade-in duration-500">
        <section className="bg-white dark:bg-surface-dark p-8 rounded-[48px] border border-gray-100 dark:border-white/10 shadow-soft flex flex-col items-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
              <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                rider.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700 border-green-200' : 
                rider.kycStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                rider.status === 'SUSPENDED' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {rider.status === 'SUSPENDED' ? 'SUSPENDED' : (rider.kycStatus || 'Unverified')}
              </span>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Current Lifecycle</p>
           </div>
           <div className="size-28 rounded-[40px] bg-secondary/10 p-1 border-2 border-primary/20 mb-6 shadow-inner">
              <img src={rider.avatar || `https://i.pravatar.cc/150?u=${rider.uid}`} className="w-full h-full object-cover rounded-[34px]" alt="" />
           </div>
           <h2 className="text-3xl font-black text-secondary dark:text-white leading-tight uppercase tracking-tighter">{rider.fullName}</h2>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 mb-8">HUB: {rider.location || 'UNASSIGNED'}</p>

           <div className="grid grid-cols-3 gap-3 w-full border-t border-gray-50 dark:border-white/5 pt-8">
              <div className="flex flex-col items-center">
                 <span className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter">{rider.vehicleType?.split(' ')[0]}</span>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Asset</span>
              </div>
              <div className="flex flex-col items-center border-x border-gray-50 dark:border-white/5">
                 <span className="text-lg font-black text-primary uppercase tracking-tighter">{rider.plateNumber || 'N/A'}</span>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Plate ID</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter">{rider.trustTier || 'BRONZE'}</span>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tier</span>
              </div>
           </div>
        </section>

        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          {(['IDENTITY', 'VEHICLE', 'DOCUMENTS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-white dark:bg-surface-dark text-secondary dark:text-primary shadow-sm' : 'text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-6">
           {activeTab === 'IDENTITY' && (
             <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft space-y-4 animate-in slide-in-from-bottom-2">
                <DataRow label="Full Name" value={rider.fullName} />
                <DataRow label="Identity Mobile" value={rider.mobile} />
                <DataRow label="Email Address" value={rider.email} />
                <DataRow label="Home Hub" value={rider.location || 'Not Set'} />
                <DataRow label="Account Status" value={rider.status || 'ACTIVE'} color={rider.status === 'SUSPENDED' ? 'text-red-500' : 'text-primary'} />
             </section>
           )}

           {activeTab === 'VEHICLE' && (
             <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft space-y-4 animate-in slide-in-from-bottom-2">
                <DataRow label="Vehicle Asset Type" value={rider.vehicleType || 'Not Registered'} />
                <DataRow label="License Plate ID" value={rider.plateNumber || 'Not Registered'} color="text-primary" />
                <DataRow label="Fulfillment SLA" value="60 MIN (ATOMIC)" />
             </section>
           )}

           {activeTab === 'DOCUMENTS' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4">
                {(!rider.kycDocuments || rider.kycDocuments.length === 0) ? (
                    <div className="col-span-full py-20 text-center opacity-30 bg-white dark:bg-surface-dark rounded-[40px] border-2 border-dashed flex flex-col items-center">
                       <span className="material-symbols-outlined text-5xl mb-4">folder_open</span>
                       <p className="text-xs font-black uppercase tracking-widest">Rider has not broadcasted verification documents</p>
                    </div>
                ) : (
                    rider.kycDocuments.map(doc => (
                        <div key={doc.id} className="bg-white dark:bg-surface-dark rounded-[40px] border border-gray-100 dark:border-white/5 shadow-soft overflow-hidden flex flex-col group">
                            <div className="relative aspect-video bg-gray-100 dark:bg-black/40">
                                <img src={doc.fileUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all cursor-zoom-in" alt="" />
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest">
                                    {doc.type.replace('_', ' ')}
                                </div>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">State</p>
                                    <span className={`text-[10px] font-black uppercase ${doc.status === 'VERIFIED' ? 'text-green-500' : 'text-amber-500'}`}>{doc.status}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => updateKycStatus('VERIFIED', doc.id)}
                                        className="size-10 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 flex items-center justify-center active:scale-90"
                                    ><span className="material-symbols-outlined text-[18px]">check</span></button>
                                    <button 
                                        onClick={() => updateKycStatus('REJECTED', doc.id)}
                                        className="size-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center active:scale-90"
                                    ><span className="material-symbols-outlined text-[18px]">close</span></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
             </div>
           )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-white/5 p-8 pb-12 shadow-[0_-20px_80px_rgba(0,0,0,0.15)]">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
           <div className="flex items-center gap-3">
              <button 
                disabled={isUpdating || rider.kycStatus === 'VERIFIED'}
                onClick={() => updateKycStatus('VERIFIED')}
                className="flex-[2] h-16 bg-primary text-secondary font-black text-sm uppercase tracking-[0.2em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30"
              >
                  <span className="material-symbols-outlined font-black">verified_user</span>
                  {rider.kycStatus === 'VERIFIED' ? 'Fully Authorized' : 'Verify & Approve Account'}
              </button>
              
              <button 
                disabled={isUpdating || rider.status === 'SUSPENDED'}
                onClick={() => handleAccountAction('SUSPEND')}
                className="flex-1 h-16 bg-secondary text-white font-black text-[10px] uppercase tracking-widest rounded-[24px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                  <span className="material-symbols-outlined text-xl">block</span>
                  Suspend
              </button>
           </div>
           
           <button 
            disabled={isUpdating}
            onClick={() => handleAccountAction('DELETE')}
            className="w-full h-12 bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 active:scale-95 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
           >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Erase Personnel Node
           </button>
        </div>
      </footer>
    </div>
  );
};

const DataRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-4 border-b border-gray-50 dark:border-white/5 last:border-0">
     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
     <span className={`text-[11px] font-black ${color || 'text-secondary dark:text-white'}`}>{value}</span>
  </div>
);

export default AdminRiderProfile;
