
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

import SystemAlert from '../components/SystemAlert';
import { AuditService } from '../lib/auditService';

const AdminVendorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'CONFIRM';
    onConfirm?: () => void;
    customSlot?: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'INFO',
  });

  const showAlert = (title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER') => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm: undefined });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'CONFIRM' | 'DANGER' = 'CONFIRM') => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users"), where("role", "==", "VENDOR"));
        const snap = await getDocs(q);
        const vendorData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVendors(vendorData);
      } catch (e) {
        console.error("Vendor fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [alertConfig.isOpen]); // Refresh when alert closes/changes (simple way to update list after action)

  const handleUpdateStatus = (vendorId: string, action: 'SUSPEND' | 'REINSTATE' | 'DELETE') => {
    if (action === 'SUSPEND') {
      showConfirm(
        'Suspend Verified Node?',
        'This will immediately lock the vendor dashboard and delist all products. This action is reversible by Super Admin only.',
        async () => {
          try {
            await updateDoc(doc(db, "users", vendorId), {
              trustTier: 'UNVERIFIED', // Downgrade tier
              vendorStatus: 'SUSPENDED',
              isAccountLocked: true, // Explicit lock flag often used in auth checks
              lastAdminAction: serverTimestamp()
            });
            await AuditService.logAction('ADMIN', 'Current Admin', 'SUSPEND', `Suspended Vendor ${vendorId}`, 'HIGH', 'USER', vendorId);

            showAlert('Protocol Executed', 'Vendor node has been suspended and isolated from the network.', 'SUCCESS');
            setAlertConfig(prev => ({ ...prev, isOpen: false })); // Close confirm, open success? Actually showAlert replaces it.
            // Re-open success alert after a brief tick to allow state transition if needed, 
            // but setState is batched. Better to close confirm then show success.
            setTimeout(() => showAlert('Protocol Executed', 'Vendor node has been suspended and isolated from the network.', 'SUCCESS'), 100);

          } catch (err) {
            console.error(err);
            setTimeout(() => showAlert('Execution Failed', 'Insufficient permissions to modify this node.', 'DANGER'), 100);
          }
        },
        'DANGER'
      );
    } else if (action === 'REINSTATE') {
      showConfirm(
        'Reinstate Access?',
        'This will restore dashboard access for the vendor. You may need to manually re-verify their KYC if previously rejected.',
        async () => {
          try {
            await updateDoc(doc(db, "users", vendorId), {
              vendorStatus: 'ACTIVE',
              isAccountLocked: false,
              lastAdminAction: serverTimestamp()
            });
            await AuditService.logAction('ADMIN', 'Current Admin', 'REINSTATE', `Reinstated Vendor ${vendorId}`, 'MEDIUM', 'USER', vendorId);

            showAlert('Access Restored', 'Vendor node is now active on the network.', 'SUCCESS');
            setAlertConfig(prev => ({ ...prev, isOpen: false }));
          } catch (err) {
            setTimeout(() => showAlert('Execution Failed', 'Insufficient permissions.', 'DANGER'), 100);
          }
        },
        'CONFIRM'
      );
    } else if (action === 'DELETE') {
      showConfirm(
        'Permanently Delete Node?',
        'This action is IRREVERSIBLE. All vendor data, products, and history will be wiped from the ledger.',
        async () => {
          try {
            // In a real app, use a cloud function to recursive delete. For now, we update status to DELETED (Soft Delete) or try deleteDoc if rules allow.
            // Let's do Soft Delete for safety + UI hiding
            await updateDoc(doc(db, "users", vendorId), {
              vendorStatus: 'DELETED',
              isAccountLocked: true,
              deletedAt: serverTimestamp()
            });
            await AuditService.logAction('ADMIN', 'Current Admin', 'DELETE', `Deleted Vendor ${vendorId}`, 'CRITICAL', 'USER', vendorId);

            showAlert('Node Terminated', 'Vendor account marked for deletion.', 'SUCCESS');
            setAlertConfig(prev => ({ ...prev, isOpen: false }));
          } catch (err) {
            setTimeout(() => showAlert('Execution Failed', 'Insufficient permissions.', 'DANGER'), 100);
          }
        },
        'DANGER'
      );
    }
  };

  const handleToggleStream = async (vendorId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", vendorId), {
        canStream: !currentStatus,
        lastAdminAction: serverTimestamp()
      });
      showAlert('Protocol Executed', `Live Stream Access has been ${!currentStatus ? 'GRANTED' : 'REVOKED'}.`, 'SUCCESS');
    } catch (e) {
      console.error(e);
      showAlert('Execution Failed', 'Permission denied.', 'DANGER');
    }
  };

  // ... (rest of filtering logic)
  const filteredVendors = filter === 'ALL'
    ? vendors
    : vendors.filter(v => v.vendorStatus === filter || (filter === 'VERIFIED' && v.kycStatus === 'VERIFIED'));

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <SystemAlert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={alertConfig.type === 'DANGER' ? 'Suspend Access' : 'Confirm'}
        customSlot={alertConfig.customSlot}
      />

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        {/* ... Header content same as before ... */}
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none">Merchant Governance</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">KYC & Compliance Hub</p>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto pb-10 no-scrollbar animate-in fade-in duration-500">
        {/* Governance Stats - Same as before */}
        <div className="grid grid-cols-2 gap-4">
          {/* ... keeping stats ... */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-card border border-gray-100 dark:border-gray-800 flex flex-col gap-3 relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-black text-secondary dark:text-white tracking-tighter">
                {vendors.filter(v => v.kycStatus === 'VERIFIED' || v.trustTier === 'GOLD').length}
              </div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Verified Nodes</div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-card border border-gray-100 dark:border-gray-800 flex flex-col gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-black text-secondary dark:text-white tracking-tighter">
                {vendors.filter(v => v.kycStatus === 'PENDING').length}
              </div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">KYC Pipeline</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['ALL', 'VERIFIED', 'PENDING', 'SUSPENDED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${filter === f
                ? 'bg-secondary text-primary border-secondary shadow-md'
                : 'bg-white dark:bg-white/5 text-gray-400 border-transparent hover:border-gray-200'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Enhanced Vendor List */}
        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} className="bg-white dark:bg-surface-dark p-6 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-soft group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img src={vendor.avatar || `https://ui-avatars.com/api/?name=${vendor.businessName || 'Vendor'}&background=random`} className="size-16 rounded-[24px] object-cover border-2 border-gray-100 dark:border-white/10" alt={vendor.businessName} />
                    {vendor.kycStatus === 'VERIFIED' && (
                      <div className="absolute -top-2 -right-2 size-6 bg-amber-400 rounded-full flex items-center justify-center border-4 border-white dark:border-surface-dark shadow-md">
                        <span className="material-symbols-outlined text-white text-[12px] font-black">star</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-base text-secondary dark:text-white truncate uppercase tracking-tighter">{vendor.businessName || vendor.fullName}</h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${vendor.vendorStatus === 'SUSPENDED' ? 'bg-red-100 text-red-600' :
                        vendor.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                          vendor.kycStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                            'bg-gray-100 text-gray-400'
                        }`}>
                        {vendor.vendorStatus === 'SUSPENDED' ? 'SUSPENDED' : (vendor.kycStatus || 'UNVERIFIED')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{vendor.businessCategory || 'Store'}</span>
                      <span className="size-1 bg-gray-200 rounded-full"></span>
                      <span className="text-[10px] font-black text-primary">${vendor.walletBalance?.toFixed(2) || '0.00'} ESCROW</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Stream Access</span>
                    <button
                      onClick={() => handleToggleStream(vendor.id, vendor.canStream || false)}
                      className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${vendor.canStream ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}
                    >
                      <span className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${vendor.canStream ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/vendor/${vendor.id}?view=kyc`)}
                    className="flex-1 h-12 bg-primary text-secondary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                    {vendor.kycStatus === 'VERIFIED' ? 'Re-Verify KYC' : 'Authorize KYC'}
                  </button>

                  <button
                    onClick={() => {
                      if (vendor.vendorStatus === 'SUSPENDED') {
                        setAlertConfig({
                          isOpen: true,
                          title: 'Review Suspended Node',
                          message: 'This vendor is currently isolated from the network. Select an action protocol:',
                          type: 'WARNING',
                          customSlot: (
                            <div className="flex flex-col gap-2 w-full">
                              <button onClick={() => handleUpdateStatus(vendor.id, 'REINSTATE')} className="w-full h-12 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-600">Reinstate Access</button>
                              <button onClick={() => handleUpdateStatus(vendor.id, 'DELETE')} className="w-full h-12 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors">Permanently Delete</button>
                              <button onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} className="w-full h-12 bg-transparent text-gray-400 font-bold text-[10px] uppercase">Cancel Review</button>
                            </div>
                          )
                        });
                      } else {
                        handleUpdateStatus(vendor.id, 'SUSPEND');
                      }
                    }}
                    className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all ${vendor.vendorStatus === 'SUSPENDED'
                      ? 'bg-secondary text-white shadow-lg border border-white/10'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-red-50 hover:text-red-500'
                      }`}
                  >
                    {vendor.vendorStatus === 'SUSPENDED' ? 'Review' : 'Suspend Access'}
                  </button>

                  <button
                    onClick={() => navigate(`/admin/vendor/${vendor.id}`)}
                    className="size-12 rounded-xl bg-secondary text-primary flex items-center justify-center active:scale-95 transition-all shadow-md group/btn"
                    title="Review Profile"
                  >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">person</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
        }
      </main >
    </div >
  );
};

export default AdminVendorManagement;
