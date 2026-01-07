import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, KYCDocument } from '../types';

const AdminVendorProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [vendor, setVendor] = useState<UserProfile | null>(null);
  
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('view') === 'kyc' ? 'KYC_REVIEW' : 'OVERVIEW';
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'KYC_REVIEW' | 'FINANCIALS'>(initialTab);
  
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "users", id), (snap) => {
      if (snap.exists()) setVendor({ uid: snap.id, ...snap.data() } as UserProfile);
    });
    return () => unsub();
  }, [id]);

  const updateKycStatus = async (status: 'VERIFIED' | 'REJECTED', docId?: string) => {
    if (!vendor || !id) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", id);
      if (docId) {
        const updatedDocs = vendor.kycDocuments?.map(d => d.id === docId ? { ...d, status } : d);
        await updateDoc(userRef, { kycDocuments: updatedDocs });
      } else {
        await updateDoc(userRef, { 
          kycStatus: status,
          trustTier: status === 'VERIFIED' ? 'GOLD' : 'BRONZE',
          lastAdminAction: serverTimestamp() 
        });
        alert(status === 'VERIFIED' ? "Authorized." : "Rejected.");
        if (status === 'VERIFIED') navigate('/admin/users');
      }
    } catch (err) { 
      alert("Mesh sync error."); 
    } finally { 
      setIsUpdating(false); 
    }
  };

  if (!vendor) return <div className="h-screen flex items-center justify-center"><div className="size-12 border-4 border-primary rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none uppercase">Compliance Auditor</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">ID: {vendor.uid.substring(0,10)}</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-64 no-scrollbar animate-in fade-in duration-500">
        <section className="bg-white dark:bg-surface-dark p-10 rounded-[48px] border border-gray-100 dark:border-gray-800 shadow-soft flex flex-col items-center text-center">
           <div className="size-28 rounded-[40px] bg-primary/10 p-1 border-2 border-primary/20 mb-6 shadow-inner">
              <img src={vendor.avatar || `https://ui-avatars.com/api/?name=${vendor.businessName}&background=015754&color=06DC7F`} className="w-full h-full object-cover rounded-[34px]" alt="" />
           </div>
           <h2 className="text-3xl font-black text-secondary dark:text-white uppercase tracking-tighter">{vendor.businessName || vendor.fullName}</h2>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 mb-8">{vendor.location || 'Global Node'}</p>
           
           <div className="grid grid-cols-3 gap-3 w-full border-t border-gray-50 pt-8">
              <DataStat label="Wallet" value={`$${(vendor.walletBalance || 0).toFixed(0)}`} />
              <DataStat label="Trust" value={vendor.trustTier || 'BRONZE'} color="text-primary" />
              <DataStat label="Orders" value={vendor.ordersFulfilled || 0} />
           </div>
        </section>

        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200">
          {(['OVERVIEW', 'KYC_REVIEW', 'FINANCIALS'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-surface-dark text-primary' : 'text-gray-400'}`}>
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {activeTab === 'KYC_REVIEW' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             {(!vendor.kycDocuments || vendor.kycDocuments.length === 0) ? (
                <div className="bg-white dark:bg-surface-dark p-24 rounded-[56px] border text-center opacity-30">
                   <p className="text-xs font-black uppercase tracking-widest">No artifacts detected</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {vendor.kycDocuments.map(doc => (
                      <div key={doc.id} className="bg-white dark:bg-surface-dark rounded-[48px] border border-gray-100 shadow-soft overflow-hidden flex flex-col group">
                         <div className="relative aspect-video bg-gray-100 dark:bg-black/40">
                            {doc.fileType === 'pdf' ? (
                               <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-primary">
                                  <span className="material-symbols-outlined text-7xl font-black">picture_as_pdf</span>
                                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-[0.2em] underline">Open PDF Artifact</a>
                               </div>
                            ) : (
                               <img src={doc.fileUrl} className="w-full h-full object-cover transition-all" alt={doc.type} />
                            )}
                            <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
                               {doc.type.replace('_', ' ')}
                            </div>
                         </div>
                         <div className="p-8 flex items-center justify-between">
                            <span className={`text-[12px] font-black uppercase ${doc.status === 'VERIFIED' ? 'text-green-500' : 'text-amber-500'}`}>{doc.status}</span>
                            <div className="flex gap-3">
                               <button onClick={() => updateKycStatus('VERIFIED', doc.id)} className="size-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center active:scale-90"><span className="material-symbols-outlined font-black">check</span></button>
                               <button onClick={() => updateKycStatus('REJECTED', doc.id)} className="size-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center active:scale-90"><span className="material-symbols-outlined font-black">close</span></button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}

        {activeTab === 'OVERVIEW' && (
           <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
             <section className="bg-white dark:bg-surface-dark p-10 rounded-[48px] border border-gray-100 dark:border-gray-800 shadow-soft space-y-4">
                <DataRow label="Entity Name" value={vendor.businessName || vendor.fullName} />
                <DataRow label="Identity Mobile" value={vendor.mobile} />
                <DataRow label="Email Access" value={vendor.email} />
                <DataRow label="Home Hub" value={vendor.location || 'Global Node'} />
                <DataRow label="Trust Tier" value={vendor.trustTier} color="text-primary" />
             </section>
           </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t p-8 pb-14">
        <div className="max-w-xl mx-auto flex gap-4">
          <button disabled={isUpdating} onClick={() => updateKycStatus('VERIFIED')} className="flex-1 h-20 bg-primary text-secondary font-black text-base uppercase tracking-[0.4em] rounded-[28px] shadow-primary-glow flex items-center justify-center gap-4 active:scale-95 disabled:opacity-40">
             <span className="material-symbols-outlined font-black text-2xl">verified_user</span> Authorize
          </button>
          <button disabled={isUpdating} onClick={() => updateKycStatus('REJECTED')} className="size-20 rounded-[28px] bg-red-600 text-white flex items-center justify-center shadow-xl active:scale-90 disabled:opacity-40">
             <span className="material-symbols-outlined text-[32px] font-black">gavel</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

const DataStat = ({ label, value, color }: any) => (
  <div className="flex flex-col items-center">
     <span className={`text-xl font-black uppercase tracking-tighter ${color || 'text-secondary dark:text-white'}`}>{value}</span>
     <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
  </div>
);

const DataRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
     <span className={`text-[11px] font-black ${color || 'text-secondary dark:text-white'}`}>{value}</span>
  </div>
);

export default AdminVendorProfile;